using UnityEngine;
using UnityEngine.UI;
using MedievalWarfare.Management;

namespace MedievalWarfare.UI
{
    public class MainMenuUI : MonoBehaviour
    {
        [Header("按钮")]
        [SerializeField] private Button startButton;
        [SerializeField] private Button continueButton;
        [SerializeField] private Button optionsButton;
        [SerializeField] private Button quitButton;

        [Header("面板")]
        [SerializeField] private GameObject mainPanel;
        [SerializeField] private GameObject optionsPanel;

        protected virtual void Awake()
        {
            if (startButton != null)
                startButton.onClick.AddListener(OnStartClicked);
            if (continueButton != null)
                continueButton.onClick.AddListener(OnContinueClicked);
            if (optionsButton != null)
                optionsButton.onClick.AddListener(OnOptionsClicked);
            if (quitButton != null)
                quitButton.onClick.AddListener(OnQuitClicked);
        }

        protected virtual void Start()
        {
            if (optionsPanel != null)
                optionsPanel.SetActive(false);
            if (mainPanel != null)
                mainPanel.SetActive(true);
        }

        protected virtual void OnStartClicked()
        {
            Debug.Log("开始新游戏");
            SceneController.Instance?.LoadWorldMap();
        }

        protected virtual void OnContinueClicked()
        {
            Debug.Log("继续游戏");
            SceneController.Instance?.LoadWorldMap();
        }

        protected virtual void OnOptionsClicked()
        {
            if (mainPanel != null)
                mainPanel.SetActive(false);
            if (optionsPanel != null)
                optionsPanel.SetActive(true);
        }

        public virtual void OnBackToMain()
        {
            if (optionsPanel != null)
                optionsPanel.SetActive(false);
            if (mainPanel != null)
                mainPanel.SetActive(true);
        }

        protected virtual void OnQuitClicked()
        {
            Debug.Log("退出游戏");
            Application.Quit();
        }

        protected virtual void OnDestroy()
        {
            if (startButton != null)
                startButton.onClick.RemoveListener(OnStartClicked);
            if (continueButton != null)
                continueButton.onClick.RemoveListener(OnContinueClicked);
            if (optionsButton != null)
                optionsButton.onClick.RemoveListener(OnOptionsClicked);
            if (quitButton != null)
                quitButton.onClick.RemoveListener(OnQuitClicked);
        }
    }
}
