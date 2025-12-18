import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/jwt";
import { getEffectiveUserId } from "@/lib/user-helpers";
import { z } from "zod";

const taxSchema = z.object({
  companyId: z.string().min(1, "La empresa es requerida"),
  name: z.string().min(1, "El nombre es requerido"),
  rate: z.number().min(0, "La tasa debe ser mayor o igual a 0").max(100, "La tasa no puede exceder 100"),
  type: z.enum(["vat", "retention", "other"], {
    errorMap: () => ({ message: "Tipo de impuesto inválido" })
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

    const taxes = await prisma.tax.findMany({
      where: {
        companyId,
        userId: effectiveUserId,
        active: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    return NextResponse.json(taxes);
  } catch (error) {
    console.error("Error fetching taxes:", error);
    return NextResponse.json(
      { error: "Error al cargar los impuestos" },
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
    const validatedData = taxSchema.parse(body);

    const tax = await prisma.tax.create({
      data: {
        userId: effectiveUserId,
        companyId: validatedData.companyId,
        code: validatedData.name, // Usar el nombre como código también
        name: validatedData.name,
        rate: validatedData.rate,
        type: validatedData.type,
      },
    });

    return NextResponse.json(tax, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating tax:", error);
    return NextResponse.json(
      { error: "Error al crear el impuesto" },
      { status: 500 }
    );
  }
}
