// Staging URL's
var AUTH_URL = "https://staging-oauth.ready.gg"; // Staging URL
var CLOUD_FUNCTION_URL = "https://us-central1-readysandbox.cloudfunctions.net/";
var API_URL = CLOUD_FUNCTION_URL + "user-signUpAnonymously";
var REFRESH_URL = CLOUD_FUNCTION_URL + "user-refreshTokens";
var BUY_URL = CLOUD_FUNCTION_URL + "storeV2-buyVirtualItems";

var STORE_URL = CLOUD_FUNCTION_URL + "storeV2-getByIds"; //get the offer and will receive X Virtual Items IDs

var INVENTORY_URL = CLOUD_FUNCTION_URL + "inventoryV2-getByAppIds";
var ITEMS_URL = CLOUD_FUNCTION_URL + "virtualItemsV2-getByIds";
var appId = "t0cjjmEBbTer4YXiRfFa"; //project id

var storeOfferId = "LDB55noxmZ2O9MStHMaf";
var idToken;
var itemId_1;
var itemId_2;

function handleTokenExpiry(errorMessage, redirectMethod) {
  document.getElementById("loader").style.display = "none"; // Hide the loader
  if (errorMessage.includes("Failed to verify the token")) {
    showToaster(
      "Token expired! Deleting saved tokens and obtaining new one...",
      "error"
    );
    removeItemsFromLocalStorage();
    signUpAnonymously(redirectMethod);
  }
}

async function refreshToken() {
  showToaster("Requesting new refresh tokens...", "info");
  document.getElementById("loader").style.display = "block"; // Show the loader
  try {
    const response = await fetch(REFRESH_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        refreshToken: localStorage.getItem("refreshToken"),
      }),
    });
    const data = await response.json();

    if (data) {
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("idToken", data.idToken);
      showToaster("New refreshed tokens saved!", "success");
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
  document.getElementById("loader").style.display = "none"; // Hide the loader
}

async function createNewUser() {
  document.getElementById("loader").style.display = "block"; // Show the loader
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        appId,
      }),
    });
    const data = await response.json();
    if (data.userId && data.idToken && data.refreshToken) {
      showToaster(
        "Succesfully obtained new idToken and refreshtoken for user : " +
          data.userId,
        "success"
      );

      document.getElementById("guestUserId").textContent = data.userId;
      idToken = data.idToken;
      document.getElementById("guestIdToken").textContent = idToken;
      document.getElementById("guestRefreshToken").textContent =
        data.refreshToken;

      // ** Save the tokens inside the browser [localStorage] **
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("idToken", data.idToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      showToaster("Tokens saved to local computer", "info");
      return;
    } else {
      showToaster("Failed to retrieve tokens!", "error");
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function signUpAnonymously(redirectMethod) {
  if (checkForSavedTokens()) {
    showToaster("Logging in automatically..", "info");
    await refreshToken();
  } else {
    showToaster("Creating new user..", "info");
    await createNewUser();
  }
  if (redirectMethod) {
    redirectMethod();
  } else {
    validateStoreOffer(); //automatically logged in
  }
}

async function validateStoreOffer() {
  function proceedWithOffer() {
    getItemDetailsById([itemId_1, itemId_2]);
  }
  const res = await Promise.all([getStoreOffer(), getInventory()]);
  if (res) {
    const storeItems = res[0].itemIds;
    const inventoryItems = res[1];

    //inventory is empty
    if (!inventoryItems.length) {
      proceedWithOffer();
    }

    //inventory is not empty
    if (inventoryItems.length) {
      const claimedItem = inventoryItems.some((invItem) => {
        return storeItems.includes(invItem.virtualItemId);
      });

      if (claimedItem) {
        disableStoreOffer("Store offer has been claimed!");
      } else {
        proceedWithOffer();
      }
    }
  }
}

async function getStoreOffer() {
  showToaster("Fetching store offer...", "info");
  document.getElementById("loader").style.display = "block"; // Show the loader

  try {
    const response = await fetch(STORE_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        appId,
        ids: [storeOfferId],
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    if (data) {
      const offer = data.offers.find((offer) => offer.id == storeOfferId);
      showToaster(
        "Store offer " + offer.name + " succesfully fetched!",
        "success"
      );
      if (offer) {
        document.getElementById("campaign-title").textContent = offer.name;
        document.getElementById("campaign-end").textContent =
          calculateDaysHoursLeft(offer.time.start, offer.time.end);
        itemId_1 = offer.itemIds[0];
        itemId_2 = offer.itemIds[1];
        return offer;
      }
    }
  } catch (error) {
    showToaster("Obtaining Store offer failed!", "error");
    handleTokenExpiry(error.message, getStoreOffer);
  }
}

async function getItemDetailsById(ids) {
  showToaster("Getting Virtual Items details...", "info");
  document.getElementById("loader").style.display = "block"; // Show the loader
  try {
    const response = await fetch(ITEMS_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        appId,
        ids,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    if (data) {
      document.getElementById("item-img-1").src =
        data.virtualItems[0].image.small;
      document.getElementById("item-img-2").src =
        data.virtualItems[1].image.small;
      showToaster("Virtual Items succesfully obtained!", "success");
      showStep2();
    }
  } catch (error) {
    showToaster("Obtaining Item details failed!", "info");
    handleTokenExpiry(error.message, () => {
      getItemDetailsById(ids);
    });
  }
  document.getElementById("loader").style.display = "none"; // Hide the loader
}

function showStep2() {
  document.getElementById("step_1").style.display = "none";
  document.getElementById("guestResponse").style.display = "block";
  document.getElementById("virtualItems").style.display = "block";
}

async function displayInventory() {
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
}

async function claimItem(itemIndex) {
  showToaster(
    "Claiming Virtual Item with ID : " + this["itemId_" + itemIndex],
    "info"
  );
  document.getElementById("loader").style.display = "block"; // Show the loader
  document.getElementById("inventory-success-response").textContent = "";
  try {
    const response = await fetch(BUY_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        appId,
        itemIds: [this["itemId_" + itemIndex]],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    if (data) {
      showToaster("Virtual Item succesfully claimed!", "success");
      disableStoreOffer("Store offer has been claimed!");
    }
  } catch (error) {
    showToaster("Claiming Item failed!", "error");
    handleTokenExpiry(error.message, () => {
      claimItem(itemIndex);
    });
  }
}

async function getInventory() {
  showToaster("Getting Inventory...", "info");
  document.getElementById("loader").style.display = "block"; // Show the loader
  try {
    const response = await fetch(INVENTORY_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        appIds: [appId],
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    if (data) {
      showToaster("Inventory succesfully provided!", "success");
      document.getElementById("loader").style.display = "none"; // Hide the loader
      return data;
    }
  } catch (error) {
    showToaster("Obtaining Inventory failed!", "error");
    handleTokenExpiry(error.message, getInventory);
  }
}

// ** HELPER METHODS : ** //
function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + getIdToken(),
  };
}

function checkForSavedTokens() {
  const savedIdToken = localStorage.getItem("idToken");
  return Boolean(savedIdToken);
}

function removeItemsFromLocalStorage() {
  localStorage.removeItem("idToken");
}

function getIdToken() {
  return localStorage.getItem("idToken");
}

function copyToClipboard(elementId) {
  var copyText = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(copyText).then(
    function () {
      alert("Copied to clipboard");
    },
    function () {
      alert("Failed to copy");
    }
  );
}

function disableStoreOffer(msg) {
  showStep2();
  document.getElementById("virtual-items").style.display = "none";
  document.getElementById("offer-message").style.display = "block";
  document.getElementById("offer-message").textContent = msg;
  showToaster("Store offer claimed!", "error");
  displayInventory();
}

function calculateDaysHoursLeft(startDate, endDate) {
  const today = new Date();
  const targetDate = new Date(endDate);
  showToaster("Checking offer validity..", "info");

  // Check if the offer has not started yet
  today < new Date(startDate) &&
    disableStoreOffer("Store Offer has not started yet!");

  const timeDifference = targetDate.getTime() - today.getTime();

  // Check if the offer has ended
  timeDifference < 0 && disableStoreOffer("Store Offer has ended!");

  const daysLeft = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor(
    (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  return `${daysLeft} days and ${hoursLeft} hours`;
}

function showToaster(message, type) {
  const container = document.getElementById("toaster-container");
  const toaster = document.createElement("div");
  toaster.className = "toaster " + type;
  toaster.textContent = message;

  // Append toaster to the container
  container.appendChild(toaster);
}
