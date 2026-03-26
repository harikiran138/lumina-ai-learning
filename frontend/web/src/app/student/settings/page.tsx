"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  User,
  Bell,
  Lock,
  Globe,
  Moon,
  Shield,
  LogOut,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  Mail,
  Loader2,
  Save,
  Brain,
} from "lucide-react";
import { api } from "@/lib/api";

type NotificationPrefs = {
  email: boolean;
  push: boolean;
  updates: boolean;
  marketing: boolean;
};

type SettingsState = {
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  avatar: string;
  notifications: NotificationPrefs;
  security: {
    deviceAlerts: boolean;
    sessionAlerts: boolean;
    hideProfileEmail: boolean;
  };
  appearance: {
    theme: string;
    reducedMotion: boolean;
  };
  language: {
    locale: string;
    timeFormat: string;
  };
  privacy: {
    profileVisibility: string;
    shareProgressWithTeachers: boolean;
    allowAIDataPersonalization: boolean;
  };
};

const defaultSettings: SettingsState = {
  name: "",
  username: "",
  email: "",
  phone: "",
  bio: "",
  location: "",
  avatar: "",
  notifications: {
    email: true,
    push: true,
    updates: true,
    marketing: false,
  },
  security: {
    deviceAlerts: true,
    sessionAlerts: true,
    hideProfileEmail: false,
  },
  appearance: {
    theme: "dark",
    reducedMotion: false,
  },
  language: {
    locale: "en",
    timeFormat: "12h",
  },
  privacy: {
    profileVisibility: "teachers",
    shareProgressWithTeachers: true,
    allowAIDataPersonalization: true,
  },
};

export default function StudentSettings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const profile = await api.getStudentProfile();
        const preferences = profile?.preferences || {};
        setSettings({
          name: profile?.name || "",
          username: profile?.username || "",
          email: profile?.email || "",
          phone: profile?.phone || "",
          bio: profile?.bio || "",
          location: profile?.location || "",
          avatar: profile?.avatar || "",
          notifications: {
            ...defaultSettings.notifications,
            ...(profile?.notification_preferences || preferences.notifications || {}),
          },
          security: {
            ...defaultSettings.security,
            ...(profile?.security_preferences || preferences.security || {}),
          },
          appearance: {
            ...defaultSettings.appearance,
            theme: preferences.theme || defaultSettings.appearance.theme,
            reducedMotion:
              preferences.reducedMotion ?? defaultSettings.appearance.reducedMotion,
          },
          language: {
            ...defaultSettings.language,
            locale: profile?.language || preferences.locale || defaultSettings.language.locale,
            timeFormat: preferences.timeFormat || defaultSettings.language.timeFormat,
          },
          privacy: {
            ...defaultSettings.privacy,
            ...(profile?.privacy_settings || preferences.privacy || {}),
          },
        });
      } catch (loadError: any) {
        setError(loadError?.message || "Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleLogout = async () => {
    await api.logout();
    window.location.href = "/login";
  };

  const updateSection = <K extends keyof SettingsState>(
    section: K,
    value: SettingsState[K],
  ) => {
    setSettings((prev) => ({ ...prev, [section]: value }));
    setFeedback(null);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setFeedback(null);

      await api.updateProfile({
        name: settings.name,
        username: settings.username,
        phone: settings.phone,
        bio: settings.bio,
        location: settings.location,
        avatar: settings.avatar,
        language: settings.language.locale,
        notification_preferences: settings.notifications,
        security_preferences: settings.security,
        privacy_settings: settings.privacy,
        preferences: {
          theme: settings.appearance.theme,
          reducedMotion: settings.appearance.reducedMotion,
          locale: settings.language.locale,
          timeFormat: settings.language.timeFormat,
          notifications: settings.notifications,
          security: settings.security,
          privacy: settings.privacy,
        },
      });

      setFeedback("Settings saved successfully.");
    } catch (saveError: any) {
      setError(saveError?.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: "profile", label: "Edit Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Moon },
    { id: "language", label: "Language", icon: Globe },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

  if (isLoading) {
    return <div className="text-white text-center p-10">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-8rem)]">
      <div className="w-full lg:w-64 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
        <nav className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all min-w-0 ${
                activeSection === section.id
                  ? "bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <section.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium truncate">{section.label}</span>
              </div>
              {activeSection === section.id && (
                <ChevronRight className="w-4 h-4 shrink-0" />
              )}
            </button>
          ))}

          <div className="pt-6 mt-6 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors min-w-0"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="font-medium truncate">Sign Out</span>
            </button>
          </div>
        </nav>
      </div>

      <div className="flex-1 glass-card p-6 lg:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {sections.find((section) => section.id === activeSection)?.label}
            </h2>
            <p className="text-gray-400 text-sm">
              These settings now persist through your student profile instead of staying as placeholders.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-lumina-primary text-black font-bold rounded-lg hover:bg-lumina-secondary transition-colors disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        {feedback && (
          <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
            {feedback}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {activeSection === "profile" && (
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-white/10 overflow-hidden">
                <img
                  src={
                    settings.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(settings.name || "Student")}&background=0D8ABC&color=fff&size=128`
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-300">Avatar URL</label>
                <input
                  type="text"
                  value={settings.avatar}
                  onChange={(e) => setSettings((prev) => ({ ...prev, avatar: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lumina-primary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Full Name"
                value={settings.name}
                onChange={(value) => setSettings((prev) => ({ ...prev, name: value }))}
              />
              <InputField
                label="Username"
                value={settings.username}
                onChange={(value) => setSettings((prev) => ({ ...prev, username: value }))}
              />
              <InputField label="Email Address" value={settings.email} disabled />
              <InputField
                label="Phone Number"
                value={settings.phone}
                onChange={(value) => setSettings((prev) => ({ ...prev, phone: value }))}
              />
              <InputField
                label="Location"
                value={settings.location}
                onChange={(value) => setSettings((prev) => ({ ...prev, location: value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Bio</label>
              <textarea
                rows={5}
                value={settings.bio}
                onChange={(e) => setSettings((prev) => ({ ...prev, bio: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lumina-primary/50 resize-none"
              />
            </div>
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="space-y-6">
            <ToggleCard
              icon={<Mail className="w-6 h-6 text-amber-500" />}
              title="Email Notifications"
              description="Receive daily summaries and important alerts."
              enabled={settings.notifications.email}
              onToggle={() =>
                updateSection("notifications", {
                  ...settings.notifications,
                  email: !settings.notifications.email,
                })
              }
            />
            <ToggleCard
              icon={<Smartphone className="w-6 h-6 text-yellow-500" />}
              title="Push Notifications"
              description="Receive real-time reminders for study plans and assignments."
              enabled={settings.notifications.push}
              onToggle={() =>
                updateSection("notifications", {
                  ...settings.notifications,
                  push: !settings.notifications.push,
                })
              }
            />
            <ToggleCard
              icon={<Bell className="w-6 h-6 text-green-500" />}
              title="Product Updates"
              description="Get notified when your courses or AI study tools improve."
              enabled={settings.notifications.updates}
              onToggle={() =>
                updateSection("notifications", {
                  ...settings.notifications,
                  updates: !settings.notifications.updates,
                })
              }
            />
            <ToggleCard
              icon={<Bell className="w-6 h-6 text-amber-500" />}
              title="Marketing Updates"
              description="Receive optional news about new courses and launches."
              enabled={settings.notifications.marketing}
              onToggle={() =>
                updateSection("notifications", {
                  ...settings.notifications,
                  marketing: !settings.notifications.marketing,
                })
              }
            />
          </div>
        )}

        {activeSection === "security" && (
          <div className="space-y-6">
            <ToggleCard
              icon={<Lock className="w-6 h-6 text-lumina-primary" />}
              title="Device Login Alerts"
              description="Alert me when a new device signs into this account."
              enabled={settings.security.deviceAlerts}
              onToggle={() =>
                updateSection("security", {
                  ...settings.security,
                  deviceAlerts: !settings.security.deviceAlerts,
                })
              }
            />
            <ToggleCard
              icon={<Shield className="w-6 h-6 text-yellow-500" />}
              title="Session Activity Alerts"
              description="Warn me about unusual session activity or repeated sign-ins."
              enabled={settings.security.sessionAlerts}
              onToggle={() =>
                updateSection("security", {
                  ...settings.security,
                  sessionAlerts: !settings.security.sessionAlerts,
                })
              }
            />
            <ToggleCard
              icon={<Mail className="w-6 h-6 text-amber-500" />}
              title="Hide Email On Profile"
              description="Keep your email hidden from other student-facing surfaces."
              enabled={settings.security.hideProfileEmail}
              onToggle={() =>
                updateSection("security", {
                  ...settings.security,
                  hideProfileEmail: !settings.security.hideProfileEmail,
                })
              }
            />
          </div>
        )}

        {activeSection === "appearance" && (
          <div className="space-y-6">
            <SelectField
              label="Theme"
              value={settings.appearance.theme}
              onChange={(value) =>
                updateSection("appearance", {
                  ...settings.appearance,
                  theme: value,
                })
              }
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
                { value: "system", label: "System" },
              ]}
            />
            <ToggleCard
              icon={<Moon className="w-6 h-6 text-lumina-primary" />}
              title="Reduced Motion"
              description="Reduce interface motion for a calmer study experience."
              enabled={settings.appearance.reducedMotion}
              onToggle={() =>
                updateSection("appearance", {
                  ...settings.appearance,
                  reducedMotion: !settings.appearance.reducedMotion,
                })
              }
            />
          </div>
        )}

        {activeSection === "language" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField
              label="Language"
              value={settings.language.locale}
              onChange={(value) =>
                updateSection("language", {
                  ...settings.language,
                  locale: value,
                })
              }
              options={[
                { value: "en", label: "English" },
                { value: "hi", label: "Hindi" },
                { value: "te", label: "Telugu" },
              ]}
            />
            <SelectField
              label="Time Format"
              value={settings.language.timeFormat}
              onChange={(value) =>
                updateSection("language", {
                  ...settings.language,
                  timeFormat: value,
                })
              }
              options={[
                { value: "12h", label: "12-hour" },
                { value: "24h", label: "24-hour" },
              ]}
            />
          </div>
        )}

        {activeSection === "privacy" && (
          <div className="space-y-6">
            <SelectField
              label="Profile Visibility"
              value={settings.privacy.profileVisibility}
              onChange={(value) =>
                updateSection("privacy", {
                  ...settings.privacy,
                  profileVisibility: value,
                })
              }
              options={[
                { value: "teachers", label: "Teachers Only" },
                { value: "institution", label: "Institution" },
                { value: "private", label: "Private" },
              ]}
            />
            <ToggleCard
              icon={<User className="w-6 h-6 text-lumina-primary" />}
              title="Share Progress With Teachers"
              description="Allow teachers to view your mastery and progress signals."
              enabled={settings.privacy.shareProgressWithTeachers}
              onToggle={() =>
                updateSection("privacy", {
                  ...settings.privacy,
                  shareProgressWithTeachers: !settings.privacy.shareProgressWithTeachers,
                })
              }
            />
            <ToggleCard
              icon={<Brain className="w-6 h-6 text-yellow-500" />}
              title="Allow AI Personalization"
              description="Use your learning patterns to personalize tutor and assessment flows."
              enabled={settings.privacy.allowAIDataPersonalization}
              onToggle={() =>
                updateSection("privacy", {
                  ...settings.privacy,
                  allowAIDataPersonalization: !settings.privacy.allowAIDataPersonalization,
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lumina-primary/50 disabled:opacity-50"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lumina-primary/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#111827]">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-xl">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        <div>
          <h3 className="text-white font-medium">{title}</h3>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <button onClick={onToggle}>
        {enabled ? (
          <ToggleRight className="w-8 h-8 text-lumina-primary" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-gray-500" />
        )}
      </button>
    </div>
  );
}
