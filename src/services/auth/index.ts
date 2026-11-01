"use server";

import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { FieldValues } from "react-hook-form";

// ✅ Use server-only environment variable
const NEXT_PUBLIC_BASE_API = process.env.NEXT_PUBLIC_BASE_API;

if (!NEXT_PUBLIC_BASE_API) {
  throw new Error(
    "❌ Environment variable NEXT_PUBLIC_BASE_API is not defined.",
  );
}

// ✅ Helper to check if response is JSON
const isJsonResponse = (res: Response) =>
  res.headers.get("content-type")?.includes("application/json");

// ✅ Register User
export const registerUser = async (userData: FieldValues) => {
  try {
    const res = await fetch(`${NEXT_PUBLIC_BASE_API}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!isJsonResponse(res)) {
      const text = await res.text();
      throw new Error(`Invalid JSON: ${text}`);
    }

    const result = await res.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Something went wrong.",
    };
  }
};

// ✅ Login User
export const loginUser = async (userData: FieldValues) => {
  try {
    const res = await fetch(`${NEXT_PUBLIC_BASE_API}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...userData, // ✅ correct
      }),
    });

    if (!isJsonResponse(res)) {
      const text = await res.text();
      throw new Error(`Invalid JSON: ${text}`);
    }

    const result = await res.json();

    if (result.success) {
      (await cookies()).set("accessToken", result.data.accessToken);
    }

    return result;
  } catch (error: any) {
    return { success: false, message: error.message || "Login failed." };
  }
};

// ✅ Get Current User (from token)
export const getCurrentUser = async () => {
  const accessToken = (await cookies()).get("accessToken")?.value;
  if (!accessToken) return null;

  try {
    const decoded = jwtDecode(accessToken);
    return decoded;
  } catch (error) {
    return null;
  }
};

// ✅ Logout
export const logout = async () => {
  (await cookies()).delete("accessToken");
};
