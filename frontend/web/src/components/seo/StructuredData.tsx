"use client";

export default function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Lumina",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "description": "Lumina is a privacy-first, teacher-verified AI learning platform that adapts to every student through adaptive knowledge modeling.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "Nadimpalli Informatics LLP"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
