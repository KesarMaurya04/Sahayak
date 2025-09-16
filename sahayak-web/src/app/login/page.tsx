"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    await apiFetch("/api/auth/login", { method: "POST", json: values });
    location.href = "/";
  };

  return (
    <div className="mx-auto max-w-md animate-fadeUp card">
      <h1 className="mb-4 text-xl font-semibold">Login</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input
            className="input"
            {...register("email")}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input className="input" type="password" {...register("password")} />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>
        <button disabled={isSubmitting} className="btn">
          {isSubmitting ? "..." : "Login"}
        </button>
        <p className="mt-3 text-sm">
          <a href="/forgot-password" className="link">
            Forgot password?
          </a>
        </p>
      </form>
    </div>
  );
}
