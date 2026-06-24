using UnityEngine;
using UnityEngine.UI;
using MedievalWarfare.Management;
using MedievalWarfare.Core;

namespace MedievalWarfare.Demo
{
    public class MainMenuSetup : MonoBehaviour
    {
        [Header("相机设置")]
        [SerializeField] private Color backgroundColor = new Color(0.1f, 0.1f, 0.15f);
        [SerializeField] private string titleText = "中世纪战争";
        [SerializeField] private string subtitleText = "Medieval Warfare";

        [Header("按钮")]
        [SerializeField] private Vector2 buttonSize = new Vector2(200f, 50f);
        [SerializeField] private float buttonSpacing = 20f;

        protected virtual void Awake()
        {
            SetupCamera();
            SetupCanvas();
        }

        protected virtual void Start()
        {
            GameManager.Instance?.ChangeState(GameState.MainMenu);
        }

        protected virtual void SetupCamera()
        {
            Camera mainCam = Camera.main;
            if (mainCam == null)
            {
                GameObject camObj = new GameObject("Main Camera");
                camObj.tag = "MainCamera";
                mainCam = camObj.AddComponent<Camera>();
            }
            mainCam.backgroundColor = backgroundColor;
            mainCam.clearFlags = CameraClearFlags.SolidColor;
        }

        protected virtual void SetupCanvas()
        {
            GameObject canvasObj = new GameObject("Canvas");
            Canvas canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 0;

            CanvasScaler scaler = canvasObj.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            canvasObj.AddComponent<GraphicRaycaster>();

            GameObject eventSystem = new GameObject("EventSystem");
            eventSystem.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystem.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();

            CreateTitle(canvasObj.transform);
            CreateMenuButtons(canvasObj.transform);
            CreateFooter(canvasObj.transform);

            MainMenuUI menuUI = canvasObj.AddComponent<MainMenuUI>();

            System.Reflection.BindingFlags flags = System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance;

            Transform mainPanel = canvasObj.transform.Find("MainPanel");
            menuUI.GetType().GetField("mainPanel", flags)?.SetValue(menuUI, mainPanel?.gameObject);

            Button startBtn = canvasObj.transform.Find("MainPanel/StartButton")?.GetComponent<Button>();
            menuUI.GetType().GetField("startButton", flags)?.SetValue(menuUI, startBtn);

            Button continueBtn = canvasObj.transform.Find("MainPanel/ContinueButton")?.GetComponent<Button>();
            menuUI.GetType().GetField("continueButton", flags)?.SetValue(menuUI, continueBtn);

            Button optionsBtn = canvasObj.transform.Find("MainPanel/OptionsButton")?.GetComponent<Button>();
            menuUI.GetType().GetField("optionsButton", flags)?.SetValue(menuUI, optionsBtn);

            Button quitBtn = canvasObj.transform.Find("MainPanel/QuitButton")?.GetComponent<Button>();
            menuUI.GetType().GetField("quitButton", flags)?.SetValue(menuUI, quitBtn);
        }

        protected virtual void CreateTitle(Transform parent)
        {
            GameObject titleObj = new GameObject("Title");
            titleObj.transform.SetParent(parent, false);
            RectTransform titleRect = titleObj.AddComponent<RectTransform>();
            titleRect.anchorMin = new Vector2(0.5f, 1f);
            titleRect.anchorMax = new Vector2(0.5f, 1f);
            titleRect.pivot = new Vector2(0.5f, 1f);
            titleRect.anchoredPosition = new Vector2(0, -100f);
            titleRect.sizeDelta = new Vector2(600f, 120f);

            Text titleTextComp = titleObj.AddComponent<Text>();
            titleTextComp.text = titleText;
            titleTextComp.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            titleTextComp.fontSize = 72;
            titleTextComp.alignment = TextAnchor.MiddleCenter;
            titleTextComp.color = Color.white;

            GameObject subtitleObj = new GameObject("Subtitle");
            subtitleObj.transform.SetParent(titleObj.transform, false);
            RectTransform subRect = subtitleObj.AddComponent<RectTransform>();
            subRect.anchorMin = new Vector2(0.5f, 0f);
            subRect.anchorMax = new Vector2(0.5f, 0f);
            subRect.pivot = new Vector2(0.5f, 1f);
            subRect.anchoredPosition = new Vector2(0, -10f);
            subRect.sizeDelta = new Vector2(400f, 40f);

            Text subText = subtitleObj.AddComponent<Text>();
            subText.text = subtitleText;
            subText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            subText.fontSize = 28;
            subText.alignment = TextAnchor.MiddleCenter;
            subText.color = new Color(0.7f, 0.7f, 0.7f);
        }

        protected virtual void CreateMenuButtons(Transform parent)
        {
            GameObject panelObj = new GameObject("MainPanel");
            panelObj.transform.SetParent(parent, false);
            RectTransform panelRect = panelObj.AddComponent<RectTransform>();
            panelRect.anchorMin = new Vector2(0.5f, 0.5f);
            panelRect.anchorMax = new Vector2(0.5f, 0.5f);
            panelRect.pivot = new Vector2(0.5f, 0.5f);
            panelRect.sizeDelta = new Vector2(buttonSize.x + 40f, buttonSize.y * 4 + buttonSpacing * 3 + 40f);

            string[] buttonNames = { "开始游戏", "继续游戏", "设置", "退出游戏" };
            string[] buttonInternalNames = { "StartButton", "ContinueButton", "OptionsButton", "QuitButton" };

            for (int i = 0; i < buttonNames.Length; i++)
            {
                GameObject btnObj = new GameObject(buttonInternalNames[i]);
                btnObj.transform.SetParent(panelObj.transform, false);
                RectTransform btnRect = btnObj.AddComponent<RectTransform>();
                btnRect.anchorMin = new Vector2(0.5f, 1f);
                btnRect.anchorMax = new Vector2(0.5f, 1f);
                btnRect.pivot = new Vector2(0.5f, 1f);
                btnRect.anchoredPosition = new Vector2(0, -(20f + i * (buttonSize.y + buttonSpacing)));
                btnRect.sizeDelta = buttonSize;

                Image btnImage = btnObj.AddComponent<Image>();
                btnImage.color = new Color(0.2f, 0.2f, 0.25f, 0.9f);

                Button btn = btnObj.AddComponent<Button>();
                ColorBlock colors = btn.colors;
                colors.normalColor = new Color(0.3f, 0.3f, 0.35f);
                colors.highlightedColor = new Color(0.5f, 0.5f, 0.55f);
                colors.pressedColor = new Color(0.2f, 0.2f, 0.25f);
                btn.colors = colors;

                GameObject textObj = new GameObject("Text");
                textObj.transform.SetParent(btnObj.transform, false);
                RectTransform textRect = textObj.AddComponent<RectTransform>();
                textRect.anchorMin = Vector2.zero;
                textRect.anchorMax = Vector2.one;
                textRect.offsetMin = Vector2.zero;
                textRect.offsetMax = Vector2.zero;

                Text btnText = textObj.AddComponent<Text>();
                btnText.text = buttonNames[i];
                btnText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
                btnText.fontSize = 24;
                btnText.alignment = TextAnchor.MiddleCenter;
                btnText.color = Color.white;
            }
        }

        protected virtual void CreateFooter(Transform parent)
        {
            GameObject footerObj = new GameObject("Footer");
            footerObj.transform.SetParent(parent, false);
            RectTransform footerRect = footerObj.AddComponent<RectTransform>();
            footerRect.anchorMin = new Vector2(0f, 0f);
            footerRect.anchorMax = new Vector2(1f, 0f);
            footerRect.pivot = new Vector2(0.5f, 0f);
            footerRect.sizeDelta = new Vector2(0f, 50f);

            Text footerText = footerObj.AddComponent<Text>();
            footerText.text = "操作说明: WASD移动 | 鼠标左键攻击 | 鼠标右键防御 | ESC暂停";
            footerText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            footerText.fontSize = 16;
            footerText.alignment = TextAnchor.MiddleCenter;
            footerText.color = new Color(0.5f, 0.5f, 0.5f);
        }
    }
}
