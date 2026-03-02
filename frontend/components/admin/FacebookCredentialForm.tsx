"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FacebookPageCredential } from "@/lib/types";

export function FacebookCredentialForm({
  initialCredential,
}: {
  initialCredential: FacebookPageCredential;
}) {
  const [accountName, setAccountName] = useState(initialCredential.account_name);
  const [pageId, setPageId] = useState(initialCredential.page_id);
  const [accessToken, setAccessToken] = useState(initialCredential.access_token);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fieldLabelClass = "grid gap-2";
  const eyebrowClass = "text-xs uppercase tracking-[0.16em] text-[#8da693]";

  async function saveFacebookCredential() {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/proxy/jobs/admin/channels/facebook/", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          account_name: accountName.trim(),
          page_id: pageId.trim(),
          access_token: accessToken.trim(),
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Unable to save Facebook page credential.");
      }

      setMessage("Facebook page credential saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save Facebook page credential.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
      <CardContent className="grid gap-5 p-5">
        <div>
          <div className={eyebrowClass}>Facebook upload</div>
          <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
            Page credential
          </h2>
          <p className="mt-2 max-w-[56ch] text-[0.92rem] leading-6 text-[#727975]">
            Store Facebook page ID and page access token here. Personal Facebook login
            passwords should not be entered into the admin.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Page account</span>
            <Input
              className="bg-[rgba(255,255,255,0.88)]"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Dear Career Page"
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Page ID</span>
            <Input
              className="bg-[rgba(255,255,255,0.88)]"
              value={pageId}
              onChange={(event) => setPageId(event.target.value)}
              placeholder="123456789012345"
            />
          </label>
          <label className={`${fieldLabelClass} md:col-span-2`}>
            <span className={eyebrowClass}>Page access token</span>
            <Input
              className="bg-[rgba(255,255,255,0.88)]"
              type="password"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="EAAB..."
            />
          </label>
        </div>

        {error ? (
          <div className="rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="flex items-center gap-2 rounded-md border border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] px-3 py-2 text-sm text-[#4f6354]">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            className={buttonVariants()}
            type="button"
            disabled={isSaving}
            onClick={() => void saveFacebookCredential()}
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {isSaving ? "Saving..." : "Save Facebook page"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
