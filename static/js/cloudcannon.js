document.addEventListener('cloudcannon:load', function (e) {
  onLiveEditorLoad(e.detail.CloudCannon);
});

if (!window.CloudCannon) {
  document.addEventListener('cloudcannon:load', function (e) {
    onLiveEditorLoad(e.detail.CloudCannon);
  });
} else {
  onLiveEditorLoad(window.CloudCannon);
}

function onLiveEditorLoad(CloudCannon) {
  CloudCannon.enableEvents();
}

document.addEventListener('cloudcannon:update', async function (e) {
  useNewPageProps(e.detail.CloudCannon);
});

async function useNewPageProps(CloudCannon) {
  const latestValue = await CloudCannon.value();
}

CloudCannon.set('title', 'new title value');