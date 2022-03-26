const userInputTime = document.getElementById("timeInput");
const userInputLab = document.getElementById("labInput");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const reloadButton = document.getElementById("reload");

let stopPressed = false;

stopButton.addEventListener("click", () => {
  if (!stopButton.className.includes("noClick")) {
    stopPressed = true;
    stopButton.classList.add("noClick");
    startButton.classList.remove("noClick");
  }
});

reloadButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  location.reload();
  chrome.tabs.reload(tab.id);
});

startButton.addEventListener("click", async (ev) => {
  if (startButton.className.includes("noClick")) {
    ev.preventDefault();
  } else {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    //read seconds, lab from input fields
    let seconds = parseInt(userInputTime.value);
    let labNumber = parseInt(userInputLab.value);

    if (
      !seconds ||
      seconds === 0 ||
      seconds < 0 ||
      !labNumber ||
      labNumber === 0 ||
      labNumber < 0
    ) {
      return;
    }
    stopButton.classList.remove("noClick");
    startButton.classList.add("noClick");

    while (true) {
      //if 'stop' pressed
      if (stopPressed) {
        stopPressed = false;
        return;
      }
      //execute scrpit to content page
      chrome.webNavigation.onCompleted.addListener((details) => {
        //ιf we are registered in the lab stop the refresh and initialize the button classes
        if (details.url.includes("group_id")) {
          stopPressed = true;
          startButton.classList.remove("noClick");
          stopButton.classList.add("noClick");
          return;
        }
        chrome.scripting
          .executeScript({
            args: [labNumber],
            target: { tabId: tab.id },
            function: findWithinSite,
          })
          .catch((err) => console.log(err));
      });

      chrome.tabs.reload(tab.id);

      await setTimeInterval(seconds);
    }
  }
});

function setTimeInterval(seconds) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

function findWithinSite(labNumber) {
  let registerColumn = document.querySelector(
    `#main-content > div > div > div.table-responsive > table > tbody > tr:nth-child(${
      labNumber + 1
    }) > td:nth-child(5) > a`
  );

  if (registerColumn != null) {
    let span = document.querySelector(
      `#main-content > div > div > div.table-responsive > table > tbody > tr:nth-child(${
        labNumber + 1
      }) > td:nth-child(5) > a > span`
    );

    if (span.getAttribute("class").includes("sign-in")) {
      registerColumn.click();
    }
  }
}
