import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { totpApi } from "../../api/totpApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Spinner from "../../components/atoms/Spinner";
import TotpCodeForm from "../../components/molecules/TotpCodeForm";
import type { TotpSetupResponse } from "../../types";

type ApiError = AxiosError<{ detail: string }>;

export default function AdminSecurityPage() {
  const queryClient = useQueryClient();
  const [enrollment, setEnrollment] = useState<TotpSetupResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showDisableForm, setShowDisableForm] = useState(false);

  const { data: status, isLoading } = useQuery({ queryKey: ["admin", "totp", "status"], queryFn: totpApi.status });

  const setupMutation = useMutation({
    mutationFn: totpApi.setup,
    onSuccess: (data) => setEnrollment(data),
  });

  const enableMutation = useMutation<{ enabled: boolean }, ApiError, string>({
    mutationFn: (code) => totpApi.enable(code),
    onSuccess: () => {
      setEnrollment(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "totp", "status"] });
    },
  });

  const disableMutation = useMutation<{ enabled: boolean }, ApiError, string>({
    mutationFn: (code) => totpApi.disable(code),
    onSuccess: () => {
      setShowDisableForm(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "totp", "status"] });
    },
  });

  // The QR code is rendered entirely client-side from the otpauth:// URI -
  // the secret never leaves this page or goes to any third party, just
  // like showing it as plain text below the image.
  useEffect(() => {
    if (!enrollment) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(enrollment.otpauth_uri, { width: 220, margin: 1 }).then(setQrDataUrl);
  }, [enrollment]);

  if (isLoading) return <Spinner />;

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-ink-100">Security</h2>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800 dark:text-ink-100">Two-factor authentication</p>
          <Badge tone={status?.enabled ? "success" : "neutral"}>{status?.enabled ? "Enabled" : "Disabled"}</Badge>
        </div>
        <p className="mb-3 text-sm text-slate-600 dark:text-ink-400">
          Requires a code from an authenticator app (Google Authenticator, Authy, etc.) at every login, in
          addition to your password.
        </p>

        {!status?.enabled && !enrollment ? (
          <Button onClick={() => setupMutation.mutate()} loading={setupMutation.isPending}>
            Set up two-factor authentication
          </Button>
        ) : null}

        {enrollment ? (
          <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-ink-800">
            <div>
              <p className="mb-2 text-sm text-slate-600 dark:text-ink-400">
                Scan this with your authenticator app, or enter the key manually.
              </p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="TOTP QR code" className="rounded-lg border border-slate-200 dark:border-ink-700" />
              ) : null}
              <p className="mt-2 break-all rounded-lg bg-slate-50 p-2 font-mono text-xs text-slate-700 dark:bg-ink-800 dark:text-ink-100">
                {enrollment.secret}
              </p>
            </div>
            <TotpCodeForm
              title="Confirm setup"
              description="Enter the 6-digit code your app is now showing to finish enabling two-factor authentication."
              submitLabel="Enable"
              onSubmit={(code) => enableMutation.mutate(code)}
              onCancel={() => setEnrollment(null)}
              pending={enableMutation.isPending}
              error={enableMutation.error?.response?.data?.detail}
            />
          </div>
        ) : null}

        {status?.enabled && !showDisableForm ? (
          <Button variant="danger" onClick={() => setShowDisableForm(true)}>
            Disable two-factor authentication
          </Button>
        ) : null}

        {showDisableForm ? (
          <div className="border-t border-slate-100 pt-4 dark:border-ink-800">
            <TotpCodeForm
              tone="danger"
              title="Disable two-factor authentication"
              description="Enter your current code to confirm."
              submitLabel="Disable"
              onSubmit={(code) => disableMutation.mutate(code)}
              onCancel={() => setShowDisableForm(false)}
              pending={disableMutation.isPending}
              error={disableMutation.error?.response?.data?.detail}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
