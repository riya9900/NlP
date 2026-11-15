import Features from "@/components/Features";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Features & Architecture — ReviewLens",
  description:
    "Explore the 5-stage stateless multilingual NLP review pipeline: 3-signal spam filtering, cross-lingual embeddings, and HDBSCAN aspect mining.",
};

export default function FeaturesPage() {
  return (
    <main className="flex-1 bg-white">
      <Features />
      <Footer />
    </main>
  );
}
