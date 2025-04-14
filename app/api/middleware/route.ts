import contentstack from "@contentstack/delivery-sdk";
import { NextResponse } from "next/server"
import { getContentstackEndpoints, getRegionForString } from "@timbenniks/contentstack-endpoints";
import Personalize from '@contentstack/personalize-edge-sdk';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const content_type_uid = searchParams.get("content_type_uid")
  const entry_uid = searchParams.get("entry_uid")
  const live_preview = searchParams.get("live_preview")

  const region = getRegionForString(process.env.NEXT_PUBLIC_CONTENTSTACK_REGION as string);
  const endpoints = getContentstackEndpoints(region, true)
  const hostname = live_preview ? endpoints.preview : endpoints.contentDelivery

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("api_key", process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY as string);
  headers.append("access_token", process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN as string);

  if (live_preview) {
    headers.append("live_preview", live_preview as string);
    headers.append("preview_token", process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN as string);
  }

  // personalize setup
  const projectUid = process.env.NEXT_PUBLIC_CONTENTSTACK_P13N_PROJECT_ID as string;
  const edgeApiUrl = `https://${endpoints.personalizeEdge as string}`;
  Personalize.setEdgeApiUrl(edgeApiUrl);
  const personalizeSdk = await Personalize.init(projectUid, { request });
  const variantParam = personalizeSdk.getVariantParam();
  const variantALias = Personalize.variantParamToVariantAliases(variantParam).join(",");
  headers.append("x-cs-variant-uid", variantALias);

  // call CS CDA endpoint
  const url = new URL(`https://${hostname}/v3/content_types/${content_type_uid}/entries/${entry_uid}`);
  url.searchParams.append('environment', process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT as string);
  url.searchParams.append('include_dimension', 'true');
  url.searchParams.append('include_applied_variants', 'true');

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: headers,
  });

  const result = await res.json();
  const { entry } = result

  if (process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW) {
    contentstack.Utils.addEditableTags(entry, 'page', true);
  }

  // add cookies from personalize to request
  let response = new NextResponse();
  personalizeSdk.addStateToResponse(response);

  return NextResponse.json(entry, {
    headers: response.headers
  });
}