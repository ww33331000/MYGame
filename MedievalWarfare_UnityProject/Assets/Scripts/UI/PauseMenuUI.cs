using UnityEngine;
using UnityEngine.UI;
using MedievalWarfare.Core;

namespace MedievalWarfare.UI
{
    public class PauseMenuUI : MonoBehaviour
    {
        [Header("面板")]
        [SerializeField] private GameObject pausePanel;

        [Header("按钮")]
        [SerializeField] private Button resumeButton;
        [SerializeField] private Button optionsButton;
        [SerializeField] private Button mainMenuButton;
        [SerializeField] private Button quitButton;

        private bool isPaused = false;

        public bool IsPaused => isPaused;

        protected virtual void Awake()
        {
            if (resumeButton != null)
                resumeButton.onClick.AddListener(OnResume);
            if (optionsButton != null)
                optionsButton.onClick.AddListener(OnOptions);
            if (mainMenuButton != null)
                mainMenuButton.onClick.AddListener(OnMainMenu);
            if (quitButton != null)
                quitButton.onClick.AddListener(OnQuit);
        }

        protected virtual void Start()
        {
            if (pausePanel != null)
                pausePanel.SetActive(false);

            EventManager.UI.OnPauseToggle += OnPauseToggle;
        }

        protected virtual void OnDestroy()
        {
            EventManager.UI.OnPauseToggle -= OnPauseToggle;

            if (resumeButton != null)
                resumeButton.onClick.RemoveListener(OnResume);
            if (optionsButton != null)
                optionsButton.onClick.RemoveListener(OnOptions);
            if (mainMenuButton != null)
                mainMenuButton.onClick.RemoveListener(OnMainMenu);
            if (quitButton != null)
                quitButton.onClick.RemoveListener(OnQuit);
        }

        protected virtual void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                TogglePause();
            }
        }

        public virtual void TogglePause()
        {
            if (isPaused)
            {
                Resume();
            }
            else
            {
                Pause();
            }
        }

        public virtual void Pause()
        {
            isPaused = true;
            if (pausePanel != null)
                pausePanel.SetActive(true);
            Time.timeScale = 0f;
            EventManager.UI.OnPauseToggle?.Invoke(true);
        }

        public virtual void Resume()
        {
            isPaused = false;
            if (pausePanel != null)
                pausePanel.SetActive(false);
            Time.timeScale = 1f;
            EventManager.UI.OnPauseToggle?.Invoke(false);
        }

        protected virtual void OnPauseToggle(bool paused)
        {
            isPaused = paused;
        }

        protected virtual void OnResume()
        {
            Resume();
        }

        protected virtual void OnOptions()
        {
            Debug.Log("打开设置");
        }

        protected virtual void OnMainMenu()
        {
            Time.timeScale = 1f;
            Management.SceneController.Instance?.LoadMainMenu();
        }

        protected virtual void OnQuit()
        {
            Application.Quit();
        }
    }
}
