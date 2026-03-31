const { invoke } = window.__TAURI__.core;
const { getCurrentWindow } = window.__TAURI__.window;

async function checkStatus() {
  try {
    const isPaired = await invoke('get_pairing_status');
    
    if (isPaired) {
      showState('active-state');
      return true;
    } else {
      const code = await invoke('get_pairing_code');
      if (code && code.length > 0) {
        document.getElementById('pairing-code').textContent = code;
        showState('pairing-state');
      }
      return false;
    }
  } catch (error) {
    console.error("Error checking status:", error);
    return false;
  }
}

function showState(stateId) {
  document.querySelectorAll('.state-view').forEach(el => {
    el.classList.remove('active');
  });
  document.getElementById(stateId).classList.add('active');
}

// Setup listeners
document.getElementById('minimize-btn')?.addEventListener('click', async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
});

// Initialization Loop
async function init() {
  // Initial check
  let paired = await checkStatus();
  
  // If not paired, poll every 2 seconds to see if the Rust backend finished pairing
  if (!paired) {
    const interval = setInterval(async () => {
      paired = await checkStatus();
      if (paired) {
        clearInterval(interval);
      }
    }, 2000);
  }
}

// Start app
setTimeout(init, 500); // slight delay to let Rust boot DB
