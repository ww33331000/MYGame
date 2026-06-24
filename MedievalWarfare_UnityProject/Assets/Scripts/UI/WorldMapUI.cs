using UnityEngine;
using UnityEngine.UI;
using MedievalWarfare.Map;
using MedievalWarfare.Core;
using MedievalWarfare.Management;

namespace MedievalWarfare.UI
{
    public class WorldMapUI : MonoBehaviour
    {
        [Header("信息面板")]
        [SerializeField] private GameObject infoPanel;
        [SerializeField] private Text nodeNameText;
        [SerializeField] private Text nodeTypeText;
        [SerializeField] private Text nodeDescText;
        [SerializeField] private Text nodeStatusText;

        [Header("操作按钮")]
        [SerializeField] private Button attackButton;
        [SerializeField] private Button enterButton;
        [SerializeField] private Button closeButton;

        [Header("玩家信息")]
        [SerializeField] private Text playerInfoText;

        [Header("消息提示")]
        [SerializeField] private Text messageText;
        [SerializeField] private float messageDuration = 2f;
        private float messageTimer = 0f;

        private MapNode selectedNode;

        protected virtual void OnEnable()
        {
            EventManager.WorldMap.OnNodeSelected += OnNodeSelected;
            EventManager.WorldMap.OnNodeReached += OnNodeReached;
            EventManager.WorldMap.OnTravelStart += OnTravelStart;
            EventManager.WorldMap.OnTravelEnd += OnTravelEnd;
            EventManager.UI.OnShowMessage += ShowMessage;
        }

        protected virtual void OnDisable()
        {
            EventManager.WorldMap.OnNodeSelected -= OnNodeSelected;
            EventManager.WorldMap.OnNodeReached -= OnNodeReached;
            EventManager.WorldMap.OnTravelStart -= OnTravelStart;
            EventManager.WorldMap.OnTravelEnd -= OnTravelEnd;
            EventManager.UI.OnShowMessage -= ShowMessage;
        }

        protected virtual void Awake()
        {
            if (attackButton != null)
                attackButton.onClick.AddListener(OnAttackClicked);
            if (enterButton != null)
                enterButton.onClick.AddListener(OnEnterClicked);
            if (closeButton != null)
                closeButton.onClick.AddListener(OnCloseClicked);

            if (infoPanel != null)
                infoPanel.SetActive(false);
        }

        protected virtual void Update()
        {
            if (messageTimer > 0f)
            {
                messageTimer -= Time.deltaTime;
                if (messageTimer <= 0f && messageText != null)
                {
                    messageText.gameObject.SetActive(false);
                }
            }

            UpdatePlayerInfo();
        }

        protected virtual void UpdatePlayerInfo()
        {
            if (playerInfoText == null || WorldMapManager.Instance == null) return;

            MapNode current = WorldMapManager.Instance.CurrentNode;
            string currentLocation = current != null ? current.NodeName : "未知";
            string travelStatus = WorldMapManager.Instance.IsTraveling ? "旅行中..." : "驻扎";

            playerInfoText.text = $"当前位置: {currentLocation}\n状态: {travelStatus}";
        }

        protected virtual void OnNodeSelected(MapNode node)
        {
            selectedNode = node;
            ShowNodeInfo(node);
        }

        protected virtual void OnNodeReached(MapNode node)
        {
            selectedNode = node;
            ShowNodeInfo(node);
        }

        protected virtual void ShowNodeInfo(MapNode node)
        {
            if (infoPanel == null) return;

            infoPanel.SetActive(true);

            if (nodeNameText != null)
                nodeNameText.text = node.NodeName;

            if (nodeTypeText != null)
                nodeTypeText.text = GetNodeTypeString(node.NodeType);

            if (nodeDescText != null)
                nodeDescText.text = node.Description;

            if (nodeStatusText != null)
            {
                if (node.HasEnemy)
                {
                    nodeStatusText.text = node.IsDefeated ? "已清除" : $"敌军盘踞 (x{node.EnemyCount})";
                    nodeStatusText.color = node.IsDefeated ? Color.green : Color.red;
                }
                else
                {
                    nodeStatusText.text = "安全";
                    nodeStatusText.color = Color.green;
                }
            }

            UpdateButtons(node);
        }

        protected virtual void UpdateButtons(MapNode node)
        {
            bool isCurrentNode = WorldMapManager.Instance != null &&
                                 WorldMapManager.Instance.CurrentNode == node;

            if (attackButton != null)
            {
                attackButton.gameObject.SetActive(isCurrentNode && node.HasEnemy && !node.IsDefeated);
            }

            if (enterButton != null)
            {
                enterButton.gameObject.SetActive(isCurrentNode && !node.HasEnemy);
            }
        }

        protected virtual string GetNodeTypeString(NodeType type)
        {
            switch (type)
            {
                case NodeType.Town: return "城镇";
                case NodeType.Village: return "村庄";
                case NodeType.Castle: return "城堡";
                case NodeType.EnemyCamp: return "敌军营地";
                case NodeType.BanditLair: return "强盗巢穴";
                case NodeType.Forest: return "森林";
                case NodeType.Mountain: return "山脉";
                case NodeType.River: return "河流";
                case NodeType.StartingPoint: return "起点";
                default: return "未知";
            }
        }

        protected virtual void OnAttackClicked()
        {
            Debug.Log("发起进攻！");
            SceneController.Instance?.StartBattleFromMap();
        }

        protected virtual void OnEnterClicked()
        {
            Debug.Log("进入地点");
            ShowMessage("地点功能开发中...");
        }

        protected virtual void OnCloseClicked()
        {
            if (infoPanel != null)
                infoPanel.SetActive(false);
            selectedNode = null;
        }

        protected virtual void OnTravelStart()
        {
            Debug.Log("开始旅行");
        }

        protected virtual void OnTravelEnd()
        {
            Debug.Log("旅行结束");
        }

        protected virtual void ShowMessage(string message)
        {
            if (messageText != null)
            {
                messageText.text = message;
                messageText.gameObject.SetActive(true);
                messageTimer = messageDuration;
            }
        }

        protected virtual void OnDestroy()
        {
            if (attackButton != null)
                attackButton.onClick.RemoveListener(OnAttackClicked);
            if (enterButton != null)
                enterButton.onClick.RemoveListener(OnEnterClicked);
            if (closeButton != null)
                closeButton.onClick.RemoveListener(OnCloseClicked);
        }
    }
}
