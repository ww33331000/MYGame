using UnityEngine;
using MedievalWarfare.Core;
using MedievalWarfare.UI;

namespace MedievalWarfare.Demo
{
    public class GameBootstrap : MonoBehaviour
    {
        public enum DemoMode
        {
            MainMenu,
            WorldMap,
            Battle
        }

        [Header("启动模式")]
        [SerializeField] private DemoMode startMode = DemoMode.MainMenu;

        [Header("设置")]
        [SerializeField] private bool createGameManager = true;
        [SerializeField] private bool createSceneController = true;
        [SerializeField] private bool createUIManager = true;

        protected virtual void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 1;

            if (createGameManager && GameManager.Instance == null)
            {
                GameObject gm = new GameObject("GameManager");
                gm.AddComponent<GameManager>();
            }

            if (createSceneController && SceneController == null)
            {
                GameObject sc = new GameObject("SceneController");
                sc.AddComponent<Management.SceneController>();
            }
        }

        protected virtual void Start()
        {
            switch (startMode)
            {
                case DemoMode.MainMenu:
                    StartMainMenu();
                    break;
                case DemoMode.WorldMap:
                    StartWorldMap();
                    break;
                case DemoMode.Battle:
                    StartBattle();
                    break;
            }
        }

        protected virtual void StartMainMenu()
        {
            Debug.Log("启动主菜单模式");
            gameObject.AddComponent<MainMenuSetup>();
        }

        protected virtual void StartWorldMap()
        {
            Debug.Log("启动大地图模式");
            gameObject.AddComponent<WorldMapSceneSetup>();
        }

        protected virtual void StartBattle()
        {
            Debug.Log("启动战斗模式");
            gameObject.AddComponent<BattleSceneSetup>();
        }

        private static Management.SceneController SceneController
        {
            get
            {
                return Management.SceneController.Instance;
            }
        }
    }
}
