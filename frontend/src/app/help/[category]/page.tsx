import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import HelpCategoryPage from "@/features/helpCenter/pages/HelpCategoryPage";
import { HELP_CATEGORIES } from "@/features/helpCenter/data/helpContent";

interface HelpCategoryRouteProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return HELP_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: HelpCategoryRouteProps): Promise<Metadata> {
  const { category } = await params;
  const match = HELP_CATEGORIES.find((item) => item.slug === category);
  return {
    title: match ? `${match.title} | Help Center | Eventvnv` : "Help Center | Eventvnv",
    description: match?.description,
  };
}

export default async function HelpCategoryRoute({
  params,
}: HelpCategoryRouteProps) {
  const { category } = await params;
  const match = HELP_CATEGORIES.find((item) => item.slug === category);

  if (!match) notFound();

  return (
    <>
      <Navbar />
      <HelpCategoryPage key={match.slug} category={match}/>
    </>
  );
}