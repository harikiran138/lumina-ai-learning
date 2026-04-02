import { Suspense } from "react";
import AuthGateway from "@/components/auth/AuthGateway";
import AuthSkeleton from "@/components/auth/AuthSkeleton";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors, isSubmitting: isSigningIn },
    setValue: setSignInValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors, isSubmitting: isSigningUp },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "student" },
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          if (user.mustChangePassword) {
            router.push("/change-password");
            return;
          }
          const routes: Record<string, string> = {
            super_admin: "/admin",
            admin: "/admin/dashboard",
            college_admin: "/college",
            hod: "/hod",
            faculty: "/faculty",
            teacher: "/teacher/dashboard",
            student: "/student/dashboard",
          };
          window.location.href = routes[user.role] || "/student/dashboard";
        }
      } catch (e) {
        console.error("Session check failed:", e);
      }
    };
    checkSession();
  }, []);

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    try {
      const user = await api.login(loginEmail, loginPassword);
      if (user?.mustChangePassword) {
        window.location.href = "/change-password";
        return;
      }
      if (user && user.onboardingStep !== undefined && user.onboardingStep < 5) {
        window.location.href = "/onboarding";
        return;
      }

      const roleRoutes: Record<string, string> = {
        super_admin: "/admin/dashboard",
        admin: "/admin/dashboard",
        college_admin: "/college",
        hod: "/hod",
        faculty: "/faculty",
        teacher: "/teacher/dashboard",
        student: "/student/dashboard",
      };

      if (user && user.role) {
        window.location.href = roleRoutes[user.role] || "/student/dashboard";
      } else {
        window.location.href = "/student/dashboard";
      }
    } catch (error: any) {
      const message = error.message || "Login failed";
      toast.error(message);
    }
  };

  const onSignIn = async (data: LoginFormData) => {
    await performLogin(data.email, data.password);
  };

  const onSignUp = async (data: RegisterFormData) => {
    try {
      const newUser = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role ?? "student",
        status: "active" as const,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
        preferences: { theme: "dark", notifications: true },
        createdAt: new Date().toISOString(),
      };
      const user = await api.createUser(newUser);
      const roleRoutes: Record<string, string> = {
        super_admin: "/admin/dashboard",
        admin: "/admin/dashboard",
        college_admin: "/college",
        hod: "/hod",
        faculty: "/faculty",
        teacher: "/teacher/dashboard",
        student: "/student/dashboard",
      };

      if (user?.role === "student" || user?.role === "teacher" || user?.role === "hod" || user?.role === "faculty" || user?.role === "college_admin") {
        window.location.href = "/onboarding";
      } else if (user && user.role) {
        window.location.href = roleRoutes[user.role] || "/student/dashboard";
      } else {
        window.location.href = "/student/dashboard";
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    }
  };

  const quickLogin = async (role: string) => {
    const defaultUsers: Record<string, { email: string; password: string }> = {
      admin: { email: "admin@lumina.ai", password: "DemoPassword123!" },
      teacher: { email: "teacher@lumina.ai", password: "DemoPassword123!" },
      student: { email: "student@lumina.ai", password: "DemoPassword123!" },
      parent: { email: "parent@lumina.ai", password: "DemoPassword123!" },
      mentor: { email: "mentor@lumina.ai", password: "DemoPassword123!" },
      counselor: { email: "counselor@lumina.ai", password: "DemoPassword123!" },
      researcher: { email: "researcher@lumina.ai", password: "DemoPassword123!" },
      content_creator: { email: "creator@lumina.ai", password: "DemoPassword123!" },
    };
    const userData = defaultUsers[role];
    if (userData) {
      await performLogin(userData.email, userData.password);
    }
  };

  const isLoading = isSigningIn || isSigningUp;

  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthGateway mode="login" />
    </Suspense>
  );
}
