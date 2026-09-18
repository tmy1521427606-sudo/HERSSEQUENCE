import HomeExperience from "@/components/HomeExperience";
import { faqs, personas, plans } from "@/content";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hersequence.example";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "她序 HERSEQUENCE",
      url: siteUrl,
      logo: `${siteUrl}/favicon.svg`,
      description: "按女性生命阶段、饮食方式与作息状态组合每日营养的订阅服务。",
      slogan: "为每一个她，定制专属营养",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "她序 HERSEQUENCE",
      inLanguage: "zh-CN",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@type": "ItemList",
      "@id": `${siteUrl}/#personas`,
      name: "女性阶段方案",
      itemListElement: personas.map((persona, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: persona.name,
        description: persona.detail,
      })),
    },
    {
      "@type": "Product",
      "@id": `${siteUrl}/#subscription`,
      name: "她序女性阶段定制营养订阅",
      description: "包含每日独立日包的月度营养订阅，方案按生命阶段、饮食方式与安全边界组合。",
      brand: { "@id": `${siteUrl}/#organization` },
      offers: plans.map((plan) => ({
        "@type": "Offer",
        name: plan.label,
        price: plan.price,
        priceCurrency: "CNY",
        availability: "https://schema.org/PreOrder",
        url: `${siteUrl}/quiz`,
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomeExperience />
    </>
  );
}
