import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { CONFIG } from "./config";

const userPool = new CognitoUserPool({
  UserPoolId: CONFIG.cognitoUserPoolId,
  ClientId: CONFIG.cognitoClientId,
});

export function getGoogleLoginUrl() {
  const params = new URLSearchParams({
    identity_provider: "Google",
    response_type: "token",
    client_id: CONFIG.cognitoClientId,
    redirect_uri: CONFIG.redirectUri,
    scope: "email openid profile",
  });

  return `${CONFIG.cognitoDomain}/oauth2/authorize?${params.toString()}`;
}

export function parseCognitoCallback() {
  const hash = window.location.hash;

  if (!hash.includes("access_token")) {
    return false;
  }

  const tokenString = hash.replace(/^#\/?/, "");
  const params = new URLSearchParams(tokenString);
  const accessToken = params.get("access_token");
  const idToken = params.get("id_token");

  if (!accessToken) {
    return false;
  }

  localStorage.setItem("accessToken", accessToken);

  if (idToken) {
    const payload = JSON.parse(atob(idToken.split(".")[1]));
    localStorage.setItem("userId", payload.sub);
    if (payload.email) {
      localStorage.setItem("email", payload.email);
    }
  }

  window.history.replaceState({}, document.title, "/");
  return true;
}

export function getAccessToken() {
  return localStorage.getItem("accessToken") || "";
}

export function getUserId() {
  return localStorage.getItem("userId") || "";
}

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("email");
}

export function loginWithEmail(email: string, password: string) {
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  return new Promise<void>((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        localStorage.setItem("accessToken", session.getAccessToken().getJwtToken());
        localStorage.setItem("email", email);

        cognitoUser.getUserAttributes((error, attributes) => {
          if (error) {
            reject(error);
            return;
          }

          const sub = attributes?.find((item) => item.getName() === "sub")?.getValue();
          if (sub) {
            localStorage.setItem("userId", sub);
          }
          resolve();
        });
      },
      onFailure: reject,
    });
  });
}

export function registerUser(email: string, password: string, givenName: string, familyName: string) {
  const attributes = [
    new CognitoUserAttribute({ Name: "email", Value: email }),
    new CognitoUserAttribute({ Name: "given_name", Value: givenName }),
    new CognitoUserAttribute({ Name: "family_name", Value: familyName }),
  ];

  return new Promise<void>((resolve, reject) => {
    userPool.signUp(email, password, attributes, [], (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export function confirmUser(email: string, code: string) {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  return new Promise<void>((resolve, reject) => {
    cognitoUser.confirmRegistration(code, true, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
