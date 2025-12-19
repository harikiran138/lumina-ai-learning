
// This worker handles background analytics processing
// to offload heavy calculations from the main thread.

self.onmessage = (e) => {
    const { type, data } = e.data;

    if (type === 'PROCESS_ANALYTICS') {
        const { timestamp, page, action } = data;

        // Simulate heavy processing
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
            result += Math.random();
        }

        console.log(`[Worker] Processed analytics for ${page}:${action} at ${timestamp}. Result: ${result}`);

        // In a real app, we might aggregate data here before sending to backend
        // or prioritize events.

        self.postMessage({
            type: 'ANALYTICS_PROCESSED',
            status: 'success',
            processedAt: new Date().toISOString()
        });
    }
};
