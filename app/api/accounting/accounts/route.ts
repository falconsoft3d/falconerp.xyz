import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/jwt";
import { getEffectiveUserId } from "@/lib/user-helpers";
import { z } from "zod";

const accountSchema = z.object({
  companyId: z.string().min(1, "La empresa es requerida"),
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(["asset", "liability", "equity", "income", "expense"], {
    errorMap: () => ({ message: "Tipo de cuenta inválido" })
  }),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "La empresa es requerida" },
        { status: 400 }
      );
    }

    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const accounts = await prisma.account.findMany({
      where: {
        companyId,
        userId: effectiveUserId,
        active: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Error al cargar las cuentas contables" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const body = await req.json();
    const validatedData = accountSchema.parse(body);

    // Verificar que no exista una cuenta con el mismo código
    const existing = await prisma.account.findFirst({
      where: {
        companyId: validatedData.companyId,
        code: validatedData.code,
        userId: effectiveUserId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese código" },
        { status: 400 }
      );
    }

    const account = await prisma.account.create({
      data: {
        userId: effectiveUserId,
        companyId: validatedData.companyId,
        code: validatedData.code,
        name: validatedData.name,
        type: validatedData.type,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta contable" },
      { status: 500 }
    );
  }
}
