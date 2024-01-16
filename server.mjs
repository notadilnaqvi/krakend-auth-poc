import "dotenv/config";
import express from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const app = express();

const cognitoJwtVerifier = CognitoJwtVerifier.create({
  tokenUse: "access",
  clientId: process.env.AWS_CLIENT_ID,
  userPoolId: process.env.AWS_USER_POOL_ID,
});

export const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
  ClientId: process.env.AWS_CLIENT_ID,
  UserPoolId: process.env.AWS_USER_POOL_ID,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * This endpoint takes in a Cognito JWT token and a Shopify customer ID to
 * verify that the customer is authenticated.
 *
 * A customer is considered authenticated if:
 * - Their Cognito JWT token is valid
 * - Their Cognito email matches their Shopify email
 */
app.get("/", async (req, res) => {
  if (req.method !== "GET") {
    return res.sendStatus(405);
  }

  const authJwt = req.headers["authorization"]?.split(" ").at(1);
  const shopifyCustomerId = req.headers["x-shopify-customer-id"];

  if (!authJwt || !shopifyCustomerId) {
    console.log("[debug] missing authJwt or shopifyCustomerId");
    return res.sendStatus(401);
  }

  try {
    // Verify the JWT token is valid
    await cognitoJwtVerifier.verify(authJwt);

    // TODO (Adil): Uncomment once we have AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    // https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_GetUser.html
    // const cognitoUserData = await cognitoIdentityProviderClient.send(
    //   new GetUserCommand({
    //     AccessToken: authJwt,
    //   }),
    // );
    // const cognitoUserEmail = cognitoUserData.some.unknown.key
    const cognitoUserEmail = "test_user@example.com";

    // TODO (Adil): Uncomment once we have SHOPIFY_ADMIN_API_ACCESS_TOKEN
    // https://shopify.dev/docs/api/admin-rest/2024-01/resources/customer#get-customers-customer-id
    // const shopifyCustomerRes = await fetch(
    //   "https://quitelikeau.myshopify.com/admin/api/2024-01/customers/" +
    //     shopifyCustomerId +
    //     ".json",
    //   {
    //     headers: {
    //       "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
    //     },
    //   },
    // );
    // const shopifyCustomer = await shopifyCustomerRes.json();
    // const shopifyCustomerEmail = shopifyCustomer?.customer?.email;
    const shopifyCustomerEmail = "test_user@example.com";

    if (cognitoUserEmail !== shopifyCustomerEmail) {
      console.log("[debug] cognitoUserEmail !== shopifyCustomerEmail");
      return res.sendStatus(401);
    }
  } catch (err) {
    console.log("[debug] invalid authJwt", err);
    return res.sendStatus(401);
  }
  // This endpoint will be used with KrakenD authentication flow and it's
  // important that we send a JSON response back (even if it's empty)
  res.json({});
});

app.listen(8000, () => {
  console.log("Listening on http://localhost:8000");
});
