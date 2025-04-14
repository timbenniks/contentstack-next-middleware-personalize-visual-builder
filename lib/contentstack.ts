import contentstack from '@contentstack/delivery-sdk'
import ContentstackLivePreview, { IStackSdk } from '@contentstack/live-preview-utils';
import Personalize from '@contentstack/personalize-edge-sdk';
import { createContext } from 'react';
import { getContentstackEndpoints, getRegionForString } from "@timbenniks/contentstack-endpoints";

const region = getRegionForString(process.env.NEXT_PUBLIC_CONTENTSTACK_REGION as string);
const endpoints = getContentstackEndpoints(region, true)

// Stack creation
export const stack = contentstack.stack({
  apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY as string,
  deliveryToken: process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN as string,
  environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT as string,
  region,
  live_preview: {
    enable: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true',
    preview_token: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN,
    host: endpoints.preview,
  }
});

// Livepreview Init
export async function initLivePreview() {
  ContentstackLivePreview.init({
    ssr: false,
    enable: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true',
    mode: "builder",
    stackSdk: stack.config as IStackSdk,
    stackDetails: {
      apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY as string,
      environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT as string,
    },
    clientUrlParams: {
      host: endpoints.application,
    },
    editButton: {
      enable: true,
      exclude: ["outsideLivePreviewPortal"]
    },
  });
}

// Personalize context creation
const edgeApiUrl = `https://${endpoints.personalizeEdge as string}`;
const projectUid = process.env.NEXT_PUBLIC_CONTENTSTACK_P13N_PROJECT_ID as string;

Personalize.setEdgeApiUrl(edgeApiUrl);
const personalizeInstance = await Personalize.init(projectUid);

export const PersonalizeContext = createContext(personalizeInstance);

// Query middleware including all query params
export async function getPage(uid: string, searchParams: any) {
  const live_preview = ContentstackLivePreview.hash;
  const entry_uid = uid || "blt219e50af0a5ac9aa";
  const content_type_uid = "page";

  const url = new URL("http://localhost:3000/api/middleware");
  url.searchParams.append('content_type_uid', content_type_uid);
  url.searchParams.append('entry_uid', entry_uid);
  live_preview && url.searchParams.append('live_preview', live_preview);

  Object.entries(searchParams).forEach(([key, val]) => {
    url.searchParams.append(key, String(val));
  });

  const result = await fetch(url.toString());
  return await result.json();
}