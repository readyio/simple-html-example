// Staging URLs
const AUTH_URL = "https://staging-oauth.ready.gg"; // Staging URL
const CLOUD_FUNCTION_URL =
  "https://us-central1-readysandbox.cloudfunctions.net/";
const API_URL = `${CLOUD_FUNCTION_URL}user-signUpAnonymously`;
const REFRESH_URL = `${CLOUD_FUNCTION_URL}user-refreshTokens`;
const BUY_URL = `${CLOUD_FUNCTION_URL}storeV2-buyVirtualItems`;
const STORE_URL = `${CLOUD_FUNCTION_URL}storeV2-getByIds`;
const INVENTORY_URL = `${CLOUD_FUNCTION_URL}inventoryV2-getByAppIds`;
const ITEMS_URL = `${CLOUD_FUNCTION_URL}virtualItemsV2-getByIds`;

const appId = "t0cjjmEBbTer4YXiRfFa"; // Project ID
const storeOfferId = "LDB55noxmZ2O9MStHMaf";
let idToken;
let itemId_1;
let itemId_2;

// Common headers for fetch requests
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getIdToken()}`,
});

// Handle token expiry
const handleTokenExpiry = (errorMessage, redirectMethod) => {
  if (errorMessage.includes("Failed to verify the token")) {
    showToaster(
      "Token expired! Deleting saved tokens and obtaining new one...",
      "error"
    );
    removeItemsFromLocalStorage();
    signUpAnonymously(redirectMethod);
  }
};

// Fetch wrapper with error handling
const fetchData = async (url, method, body) => {
  document.getElementById("loader").style.display = "block"; // Show the loader
  try {
    const response = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await response.json();
    document.getElementById("loader").style.display = "none"; // Hide the loader

    if (!response.ok) {
      throw new Error(data.message);
    }
    return data;
  } catch (error) {
    document.getElementById("loader").style.display = "none"; // Hide the loader
    throw error;
  }
};

// Refresh token
const refreshToken = async () => {
  showToaster("Requesting new refresh tokens...", "info");
  try {
    const data = await fetchData(REFRESH_URL, "POST", {
      refreshToken: localStorage.getItem("refreshToken"),
    });
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("idToken", data.idToken);
    showToaster("New refreshed tokens saved!", "success");
  } catch (error) {
    alert("Error: " + error.message);
  }
};

// Create new user
const createNewUser = async () => {
  try {
    const data = await fetchData(API_URL, "POST", { appId });
    if (data.userId && data.idToken && data.refreshToken) {
      showToaster(
        `Successfully obtained new idToken and refreshToken for user: ${data.userId}`,
        "success"
      );
      // Save the tokens inside the browser [localStorage]
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("idToken", data.idToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      showToaster("Tokens saved to local computer", "info");
    } else {
      showToaster("Failed to retrieve tokens!", "error");
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
};

// Sign up anonymously
const signUpAnonymously = async (redirectMethod) => {
  if (checkForSavedTokens()) {
    showToaster("Logging in automatically...", "info");
    await refreshToken();
  } else {
    showToaster("Creating new user...", "info");
    await createNewUser();
  }
  if (redirectMethod) {
    redirectMethod();
  } else {
    validateStoreOffer(); // Automatically logged in
  }
};

// Validate store offer
const validateStoreOffer = async () => {
  const res = await Promise.all([getStoreOffer(), getInventory()]);
  if (res) {
    const storeItems = res[0].itemIds;
    const inventoryItems = res[1];

    // Inventory is empty
    if (!inventoryItems.length) {
      proceedWithOffer();
    }

    // Inventory is not empty
    if (inventoryItems.length) {
      const claimedItem = inventoryItems.some((invItem) =>
        storeItems.includes(invItem.virtualItemId)
      );
      if (claimedItem) {
        disableStoreOffer("Store offer has been claimed!");
      } else {
        proceedWithOffer();
      }
    }
  }
};

const proceedWithOffer = () => {
  getItemDetailsById([itemId_1, itemId_2]);
};

// Get store offer
const getStoreOffer = async () => {
  showToaster("Fetching store offer...", "info");
  try {
    const data = await fetchData(STORE_URL, "POST", {
      appId,
      ids: [storeOfferId],
    });
    const offer = data.offers.find((offer) => offer.id === storeOfferId);
    showToaster(`Store offer ${offer.name} successfully fetched!`, "success");
    if (offer) {
      document.getElementById("campaign-title").textContent = offer.name;
      document.getElementById("campaign-end").textContent =
        calculateDaysHoursLeft(offer.time.start, offer.time.end);
      itemId_1 = offer.itemIds[0];
      itemId_2 = offer.itemIds[1];
      return offer;
    }
  } catch (error) {
    showToaster("Obtaining Store offer failed!", "error");
    handleTokenExpiry(error.message, getStoreOffer);
  }
};

// Get item details by ID
const getItemDetailsById = async (ids) => {
  showToaster("Getting Virtual Items details...", "info");
  try {
    const data = await fetchData(ITEMS_URL, "POST", { appId, ids });
    ["item-img-1", "item-img-2"].forEach((imageId, index) => {
      document.getElementById(imageId).src =
        data.virtualItems[index].image.small;
    });
    showToaster("Virtual Items successfully obtained!", "success");
    showStep2();
  } catch (error) {
    showToaster("Obtaining Item details failed!", "error");
    handleTokenExpiry(error.message, () => getItemDetailsById(ids));
  }
};

// Show step 2
const showStep2 = () => {
  document.getElementById("step_1").style.display = "none";
  document.getElementById("virtualItems").style.display = "block";
};

// Display inventory
const displayInventory = async () => {
  const output = await getInventory();
  if (output) {
    document.getElementById("response-inventory").style.display = "block";
    document.getElementById("inventory-success-raw").textContent =
      JSON.stringify(output);
    const formatter = new JSONFormatter(output);
    document
      .getElementById("inventory-success-response")
      .appendChild(formatter.render());
  }
};

// Claim item
const claimItem = async (itemIndex) => {
  const itemId = itemIndex === 1 ? itemId_1 : itemId_2;
  if (!itemId) {
    showToaster("Item ID is null or undefined.", "error");
    return;
  }
  showToaster(`Claiming Virtual Item with ID: ${itemId}`, "info");
  document.getElementById("inventory-success-response").textContent = "";
  try {
    await fetchData(BUY_URL, "POST", {
      appId,
      itemIds: [itemId],
    });
    showToaster("Virtual Item successfully claimed!", "success");
    disableStoreOffer("Store offer has been claimed!");
  } catch (error) {
    showToaster("Claiming Item failed!", "error");
    handleTokenExpiry(error.message, () => claimItem(itemIndex));
  }
};

// Get inventory
const getInventory = async () => {
  showToaster("Getting Inventory...", "info");
  try {
    const data = await fetchData(INVENTORY_URL, "POST", { appIds: [appId] });
    showToaster("Inventory successfully provided!", "success");
    return data;
  } catch (error) {
    showToaster("Obtaining Inventory failed!", "error");
    handleTokenExpiry(error.message, getInventory);
  }
};

// Disable store offer
const disableStoreOffer = (msg) => {
  showStep2();
  document.getElementById("virtual-items").style.display = "none";
  document.getElementById("offer-message").style.display = "block";
  document.getElementById("offer-message").textContent = msg;
  showToaster("Store offer claimed!", "error");
  displayInventory();
};

const calculateDaysHoursLeft = (startDate, endDate) => {
  const today = new Date();
  const targetDate = new Date(endDate);
  showToaster("Checking offer validity...", "info");
  if (today < new Date(startDate)) {
    disableStoreOffer("Store Offer has not started yet!");
  }
  const timeDifference = targetDate.getTime() - today.getTime();
  if (timeDifference < 0) {
    disableStoreOffer("Store Offer has ended!");
  }
  const daysLeft = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor(
    (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  return `${daysLeft} days and ${hoursLeft} hours`;
};

// Helper methods
const checkForSavedTokens = () => Boolean(localStorage.getItem("idToken"));
const removeItemsFromLocalStorage = () => localStorage.removeItem("idToken");
const getIdToken = () => localStorage.getItem("idToken");
const copyToClipboard = (elementId) => {
  const copyText = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(copyText).then(
    () => alert("Copied to clipboard"),
    () => alert("Failed to copy")
  );
};
const showToaster = (message, type) => {
  const container = document.getElementById("toaster-container");
  const toaster = document.createElement("div");
  toaster.className = `toaster ${type}`;
  toaster.textContent = message;
  container.appendChild(toaster);
};
