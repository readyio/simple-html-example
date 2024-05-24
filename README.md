# Project README

This project utilizes various endpoints and functions to interact with the Readygg API. Below is an overview of the script's functionality and its components.

## Staging URLs

- **Authentication URL (AUTH_URL):** `https://staging-oauth.ready.gg`
- **Cloud Function URL (CLOUD_FUNCTION_URL):** `https://us-central1-readysandbox.cloudfunctions.net/`

## Endpoints

- **Sign Up Anonymously (API_URL):** Endpoint for signing up anonymously.
- **Refresh Tokens (REFRESH_URL):** Endpoint for refreshing tokens.
- **Buy Virtual Items (BUY_URL):** Endpoint for purchasing virtual items.
- **Get Store Offer (STORE_URL):** Endpoint for fetching store offers.
- **Get Inventory (INVENTORY_URL):** Endpoint for retrieving inventory.
- **Get Item Details (ITEMS_URL):** Endpoint for obtaining item details by ID.

## Project IDs

- **App ID (appId):** `t0cjjmEBbTer4YXiRfFa`
- **Store Offer ID (storeOfferId):** `LDB55noxmZ2O9MStHMaf`

## Functions

- **Handle Token Expiry (handleTokenExpiry):** Handles token expiration and obtains new tokens.
- **Fetch Data (fetchData):** Wrapper function for fetching data with error handling.
- **Refresh Token (refreshToken):** Requests new refresh tokens.
- **Create New User (createNewUser):** Creates a new user and saves tokens to local storage.
- **Sign Up Anonymously (signUpAnonymously):** Signs up a user anonymously or refreshes tokens if already logged in.
- **Validate Store Offer (validateStoreOffer):** Validates store offers and checks inventory.
- **Proceed With Offer (proceedWithOffer):** Proceeds with the store offer if conditions are met.
- **Get Store Offer (getStoreOffer):** Fetches store offers and updates UI accordingly.
- **Get Item Details By ID (getItemDetailsById):** Retrieves item details by ID and updates UI.
- **Show Step 2 (showStep2):** Shows step 2 of the process.
- **Display Inventory (displayInventory):** Displays user inventory.
- **Claim Item (claimItem):** Claims a virtual item and disables the store offer.
- **Get Inventory (getInventory):** Retrieves user inventory.
- **Disable Store Offer (disableStoreOffer):** Disables the store offer and displays inventory.
- **Calculate Days Hours Left (calculateDaysHoursLeft):** Calculates remaining time for the store offer.

## Helper Methods

- **Check For Saved Tokens (checkForSavedTokens):** Checks if tokens are saved in local storage.
- **Remove Items From Local Storage (removeItemsFromLocalStorage):** Removes tokens from local storage.
- **Get ID Token (getIdToken):** Retrieves the ID token from local storage.
- **Copy To Clipboard (copyToClipboard):** Copies text to the clipboard.
- **Show Toaster (showToaster):** Displays toaster messages.

This script provides a comprehensive solution for interacting with the Readygg API, managing user authentication, and handling store offers and inventory. Feel free to explore and customize it further based on your project requirements.
