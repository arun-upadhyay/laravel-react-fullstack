import { api } from "./client";
import type { AuthResponse, User } from "../types/auth";

export async function register(
  name: string,
  email: string,
  password: string,
  passwordConfirmation: string
): Promise<User> {
  const res = await api.post<AuthResponse>("/register", {
    name,
    email,
    password,
    password_confirmation: passwordConfirmation,
  });

  const { user, token } = res.data;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));

  return user;
}

export async function login(
  email: string,
  password: string
): Promise<User> {
  const res = await api.post<AuthResponse>("/login", {
    email,
    password,
  });

  const { user, token } = res.data;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));

  return user;
}

export function logoutLocal(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function logoutApi(): Promise<void> {
  await api.post("/logout");
}

export function getStoredUser(): User | null {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<User>("/me");
  return res.data;
}
