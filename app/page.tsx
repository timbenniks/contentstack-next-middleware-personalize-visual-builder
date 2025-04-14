"use client";

import Image from "next/image";
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import { getPage, initLivePreview } from "@/lib/contentstack";
import { use, useEffect, useState } from "react";
import { Page } from "@/lib/types";
import PersonalizeButton from "./components/PersonalizeButton";

export default function Home(props: {
  searchParams: Promise<Record<string, string>>;
}) {
  const searchParams = use(props.searchParams);

  const [page, setPage] = useState<Page>();
  const getContent: () => Promise<void> = async () => {
    const page = await getPage("blt219e50af0a5ac9aa", searchParams);
    setPage(page);
  };

  useEffect(() => {
    initLivePreview();

    async function fetchContent() {
      ContentstackLivePreview.onEntryChange(await getContent);
    }
    fetchContent();
  }, []);

  return (
    <main className="max-w-screen-2xl mx-auto">
      <section className="p-4">
        <div className="mb-8 space-y-4">
          <PersonalizeButton type="Marketer" />
          <PersonalizeButton type="Developer" />
          <PersonalizeButton type="Reset" />
        </div>

        {page?.title ? (
          <h1
            className="text-4xl font-bold mb-4"
            {...(page?.$ && page?.$.title)}
          >
            {page?.title}
          </h1>
        ) : null}

        {page?.description ? (
          <p className="mb-4" {...(page?.$ && page?.$.description)}>
            {page?.description}
          </p>
        ) : null}

        {page?.image ? (
          <Image
            className="mb-4"
            width={600}
            height={600}
            src={page?.image.url}
            alt={page?.image.title}
            {...(page?.image?.$ && page?.image?.$.url)}
          />
        ) : null}

        {page?.rich_text ? (
          <div
            {...(page?.$ && page?.$.rich_text)}
            dangerouslySetInnerHTML={{ __html: page?.rich_text }}
          />
        ) : null}
      </section>
    </main>
  );
}
