import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { getMockStore, hashPassword } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

function isAdminUser(admin) {
  const r = String(admin?.role || "").toLowerCase();
  return r === "admin" || r === "superadmin";
}

export async function PATCH(request, { params }) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  if (!isAdminUser(auth.admin)) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const store = getMockStore();
  const user = store.users.find((u) => String(u.id) === String(id));
  if (!user) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }

  if (body.displayName !== undefined) user.displayName = String(body.displayName);
  if (body.role !== undefined) user.role = String(body.role);
  if (body.assignedStation !== undefined) {
    user.assignedStation = String(body.assignedStation);
  }
  if (body.isActive !== undefined) user.isActive = Boolean(body.isActive);
  if (body.password) user.passwordHash = hashPassword(String(body.password));

  return NextResponse.json({
    success: true,
    message: "User updated",
    data: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      assignedStation: user.assignedStation,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    },
  });
}

export async function DELETE(request, { params }) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  if (!isAdminUser(auth.admin)) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const store = getMockStore();
  const idx = store.users.findIndex((u) => String(u.id) === String(id));
  if (idx === -1) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }

  store.users.splice(idx, 1);
  return NextResponse.json({
    success: true,
    message: "User deleted",
  });
}
