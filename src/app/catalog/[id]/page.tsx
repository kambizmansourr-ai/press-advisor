import { notFound } from "next/navigation";
import { pressModels, getPressById } from "@/data/presses";
import { PressDetail } from "./PressDetail";

export function generateStaticParams() {
  return pressModels.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const press = getPressById(id);
  return { title: press ? `${press.model} | ارس زنجان` : "مدل یافت نشد | ارس زنجان" };
}

export default async function PressDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getPressById(id)) notFound();
  return <PressDetail id={id} />;
}
