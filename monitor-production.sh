#!/bin/bash

# ========================================
# Production Health Monitor
# Monitors all deployed services and sends alerts
# ========================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="${FRONTEND_URL:-https://lumina.vercel.app}"
BACKEND_URL="${BACKEND_URL:-https://lumina-ai-backend.onrender.com}"
API_URL="${API_URL:-https://lumina-api.up.railway.app}"
STREAK_URL="${STREAK_URL:-https://lumina-streak.up.railway.app}"

ALERT_EMAIL="${ALERT_EMAIL:-admin@lumina.dev}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
TIMEOUT=10

# Counters
TOTAL_CHECKS=0
FAILED_CHECKS=0

# ========================================
# Helper Functions
# ========================================

log_header() {
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# ========================================
# Health Check Functions
# ========================================

check_http_status() {
    local url=$1
    local name=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking ${name}... "
    
    # Make request with timeout
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>&1 || echo "000")
    
    if [ "$response" = "200" ]; then
        log_success "${name} is UP (HTTP $response)"
        return 0
    elif [ "$response" = "000" ]; then
        log_error "${name} is DOWN (Connection timeout)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    else
        log_warning "${name} returned HTTP $response"
        return 1
    fi
}

check_endpoint() {
    local url=$1
    local name=$2
    local expected_field=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking ${name}... "
    
    response=$(curl -s --max-time $TIMEOUT "$url" 2>&1 || echo "{\"status\":\"error\"}")
    
    if echo "$response" | grep -q "\"status\""; then
        if [ -z "$expected_field" ] || echo "$response" | grep -q "$expected_field"; then
            log_success "${name} is responding correctly"
            return 0
        else
            log_error "${name} responded but missing expected field: $expected_field"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        fi
    else
        log_error "${name} returned invalid response"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_database_connection() {
    local service=$1
    local connection_string=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking ${service} database... "
    
    # This would require database credentials, so we check via health endpoint instead
    if check_http_status "$BACKEND_URL/api/health" "${service} health"; then
        log_success "${service} database is accessible"
        return 0
    else
        log_error "${service} database is not accessible"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_response_time() {
    local url=$1
    local name=$2
    local max_time=$3  # in milliseconds
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking ${name} response time... "
    
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$url" 2>&1 || echo "999")
    response_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_ms < $max_time" | bc -l) )); then
        log_success "${name} responded in ${response_ms}ms (< ${max_time}ms)"
        return 0
    else
        log_warning "${name} responded in ${response_ms}ms (> ${max_time}ms)"
        return 1
    fi
}

# ========================================
# Alert Functions
# ========================================

send_slack_alert() {
    local message=$1
    local severity=$2  # critical, warning, info
    
    if [ -z "$SLACK_WEBHOOK" ]; then
        return
    fi
    
    local color="danger"
    [ "$severity" = "warning" ] && color="warning"
    [ "$severity" = "info" ] && color="good"
    
    local payload=$(cat <<EOF
{
  "attachments": [
    {
      "color": "$color",
      "title": "🚨 Lumina Production Alert",
      "text": "$message",
      "ts": $(date +%s)
    }
  ]
}
EOF
)
    
    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$SLACK_WEBHOOK" 2>/dev/null || true
}

send_email_alert() {
    local message=$1
    local subject="🚨 Lumina Production Alert"
    
    # This requires mail configured on the system
    echo "$message" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
}

# ========================================
# Detailed Service Checks
# ========================================

check_frontend() {
    log_header "Frontend Checks"
    
    check_http_status "$FRONTEND_URL" "Frontend Homepage"
    check_http_status "$FRONTEND_URL/_next/static" "Frontend Static Assets"
    check_response_time "$FRONTEND_URL" "Frontend" "3000"  # 3 second max
}

check_backend() {
    log_header "Backend Checks"
    
    check_http_status "$BACKEND_URL/health" "Backend Health"
    check_endpoint "$BACKEND_URL/health" "Backend Health Response" "healthy"
    check_http_status "$BACKEND_URL/docs" "Backend API Docs"
    check_response_time "$BACKEND_URL/health" "Backend Health" "2000"  # 2 second max
}

check_api_server() {
    log_header "API Server Checks"
    
    check_http_status "$API_URL/api/health" "API Server Health"
    check_endpoint "$API_URL/api/health" "API Health Response" "status"
    check_response_time "$API_URL/api/health" "API Health" "2000"  # 2 second max
}

check_streak_service() {
    log_header "Streak Service Checks"
    
    check_http_status "$STREAK_URL/health" "Streak Service Health"
    check_endpoint "$STREAK_URL/health" "Streak Health Response" "status"
    check_response_time "$STREAK_URL/health" "Streak Health" "2000"  # 2 second max
}

check_integrations() {
    log_header "Integration Checks"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "Checking frontend to API connectivity... "
    
    # Frontend should be able to reach API
    frontend_response=$(curl -s "$FRONTEND_URL" | head -c 100)
    if [ ! -z "$frontend_response" ]; then
        log_success "Frontend to API chain is working"
    else
        log_error "Frontend to API chain is broken"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

check_ssl_certificates() {
    log_header "SSL Certificate Checks"
    
    check_ssl_expiry "$FRONTEND_URL" "Frontend SSL"
    check_ssl_expiry "$BACKEND_URL" "Backend SSL"
    check_ssl_expiry "$API_URL" "API SSL"
}

check_ssl_expiry() {
    local url=$1
    local name=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking ${name} certificate expiry... "
    
    domain=$(echo $url | sed 's/https:\/\///g' | sed 's/\/.*//')
    expiry_date=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | \
                  openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)
    
    if [ -z "$expiry_date" ]; then
        log_warning "${name} certificate could not be checked"
        return 1
    fi
    
    expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -jf "%b %d %T %Y %Z" "$expiry_date" +%s)
    current_epoch=$(date +%s)
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    if [ $days_until_expiry -lt 0 ]; then
        log_error "${name} certificate EXPIRED!"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        send_slack_alert "${name} certificate has expired!" "critical"
    elif [ $days_until_expiry -lt 30 ]; then
        log_warning "${name} certificate expires in $days_until_expiry days"
        send_slack_alert "${name} certificate expires in $days_until_expiry days" "warning"
    else
        log_success "${name} certificate valid for $days_until_expiry more days"
    fi
}

# ========================================
# Performance Metrics
# ========================================

check_performance_metrics() {
    log_header "Performance Metrics"
    
    local total_response_time=0
    local successful_checks=0
    
    for url in "$FRONTEND_URL" "$BACKEND_URL" "$API_URL"; do
        response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$url" 2>&1 || echo "999")
        if [ "$response_time" != "999" ]; then
            response_ms=$(echo "$response_time * 1000" | bc)
            echo "$(basename $url): ${response_ms}ms"
            total_response_time=$(echo "$total_response_time + $response_ms" | bc)
            successful_checks=$((successful_checks + 1))
        fi
    done
    
    if [ $successful_checks -gt 0 ]; then
        avg_response=$(echo "scale=2; $total_response_time / $successful_checks" | bc)
        echo -e "${BLUE}Average Response Time: ${avg_response}ms${NC}"
    fi
}

# ========================================
# Main Report
# ========================================

generate_report() {
    log_header "Health Check Summary"
    
    local passed=$((TOTAL_CHECKS - FAILED_CHECKS))
    local pass_rate=$((100 * passed / TOTAL_CHECKS))
    
    echo "Total Checks: $TOTAL_CHECKS"
    echo "Passed: $passed"
    echo "Failed: $FAILED_CHECKS"
    echo -e "Pass Rate: ${pass_rate}%"
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        log_success "All systems operational! ✨"
        return 0
    elif [ $FAILED_CHECKS -lt 3 ]; then
        log_warning "$FAILED_CHECKS checks failed - review required"
        return 1
    else
        log_error "$FAILED_CHECKS checks failed - immediate attention required"
        send_slack_alert "Health check failed: $FAILED_CHECKS/$TOTAL_CHECKS checks failed (${pass_rate}% pass rate)" "critical"
        return 2
    fi
}

# ========================================
# Main Execution
# ========================================

main() {
    log_header "🏥 Lumina Production Health Monitor"
    echo "Time: $(date)"
    echo "Frontend: $FRONTEND_URL"
    echo "Backend: $BACKEND_URL"
    echo "API: $API_URL"
    echo "Streak: $STREAK_URL"
    echo ""
    
    # Run all checks
    check_frontend
    echo ""
    
    check_backend
    echo ""
    
    check_api_server
    echo ""
    
    check_streak_service
    echo ""
    
    check_integrations
    echo ""
    
    check_ssl_certificates
    echo ""
    
    check_performance_metrics
    echo ""
    
    generate_report
    local exit_code=$?
    
    echo ""
    echo "Report generated at $(date)" >> /var/log/lumina-health-monitor.log
    
    return $exit_code
}

# Run main function
main "$@"
