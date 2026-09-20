import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useMutation, useQuery } from "@tanstack/react-query";
import { oauthApi } from "../../api/oauthApi";
import { useAuthStore } from "../../store/authStore";

interface GoogleSignInButtonProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  // Only admin accounts can have TOTP enabled (see web/auth_routes.py's
  // _login_response) - callers that never expect an admin account here
  // (the learner portal) can omit this; the fallback below tells that
  // rare case (someone signing an admin account into the learner portal)
  // to use the right page instead of silently mis-authenticating.
  onTotpRequired?: (pendingToken: string) => void;
}

/** Renders nothing until GOOGLE_CLIENT_ID is actually configured server-side
 * (see web/oauth_routes.py's /providers endpoint) - no placeholder button
 * that looks real but can't work. */
export default function GoogleSignInButton({ onSuccess, onError, onTotpRequired }: GoogleSignInButtonProps) {
  const { data: providers } = useQuery({
    queryKey: ["oauth-providers"],
    queryFn: oauthApi.listProviders,
  });

  const loginMutation = useMutation({
    mutationFn: (credential: string) => oauthApi.loginWithGoogle(credential),
    onSuccess: (data) => {
      if ("totp_required" in data) {
        if (onTotpRequired) onTotpRequired(data.totp_pending_token);
        else onError("This account requires additional verification - please use the admin sign-in page.");
        return;
      }
      useAuthStore.getState().setSession(data);
      onSuccess();
    },
    onError: () => onError("Google sign-in failed. Please try again."),
  });

  if (!providers?.google.enabled || !providers.google.client_id) return null;

  return (
    <div className="flex justify-center">
      <GoogleOAuthProvider clientId={providers.google.client_id}>
        <GoogleLogin
          onSuccess={(response) => {
            if (response.credential) {
              loginMutation.mutate(response.credential);
            } else {
              onError("Google did not return a credential.");
            }
          }}
          onError={() => onError("Google sign-in failed. Please try again.")}
        />
      </GoogleOAuthProvider>
    </div>
  );
}
