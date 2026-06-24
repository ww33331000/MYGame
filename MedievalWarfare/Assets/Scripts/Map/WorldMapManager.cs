using UnityEngine;
using System.Collections.Generic;
using MedievalWarfare.Core;

namespace MedievalWarfare.Map
{
    public class WorldMapManager : MonoBehaviour
    {
        public static WorldMapManager Instance { get; private set; }

        [Header("地图设置")]
        [SerializeField] private MapNode[] allNodes;
        [SerializeField] private MapNode startingNode;

        [Header("玩家设置")]
        [SerializeField] private Transform playerMarker;
        [SerializeField] private float travelSpeed = 10f;

        private MapNode currentNode;
        private MapNode targetNode;
        private bool isTraveling = false;

        private List<MapNode> visitedNodes = new List<MapNode>();

        public MapNode CurrentNode => currentNode;
        public MapNode TargetNode => targetNode;
        public bool IsTraveling => isTraveling;
        public MapNode[] AllNodes => allNodes;

        public System.Action<MapNode> OnCurrentNodeChanged;
        public System.Action OnTravelStarted;
        public System.Action OnTravelEnded;

        protected virtual void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        protected virtual void Start()
        {
            InitializeMap();
        }

        protected virtual void Update()
        {
            if (isTraveling && targetNode != null)
            {
                TravelToTarget();
            }
        }

        protected virtual void InitializeMap()
        {
            if (startingNode == null && allNodes.Length > 0)
            {
                startingNode = allNodes[0];
            }

            if (startingNode != null)
            {
                SetCurrentNode(startingNode);
                UpdatePlayerMarkerPosition(startingNode.transform.position);
            }

            foreach (MapNode node in allNodes)
            {
                if (node != null)
                {
                    node.OnNodeClicked += HandleNodeClicked;
                }
            }
        }

        protected virtual void HandleNodeClicked(MapNode clickedNode)
        {
            if (isTraveling) return;
            if (clickedNode == currentNode) return;

            if (currentNode != null && currentNode.IsConnectedTo(clickedNode))
            {
                StartTravel(clickedNode);
            }
            else
            {
                Debug.Log($"无法直接前往 {clickedNode.NodeName}，需要通过相邻节点");
                EventManager.UI.OnShowMessage?.Invoke("无法直接前往该地点，请选择相邻节点");
            }
        }

        public virtual void StartTravel(MapNode destination)
        {
            if (destination == null || isTraveling) return;

            targetNode = destination;
            isTraveling = true;

            OnTravelStarted?.Invoke();
            EventManager.WorldMap.OnTravelStart?.Invoke();

            Debug.Log($"开始旅行至 {destination.NodeName}");
        }

        protected virtual void TravelToTarget()
        {
            if (playerMarker == null || targetNode == null) return;

            Vector3 targetPos = targetNode.transform.position;
            Vector3 currentPos = playerMarker.position;

            playerMarker.position = Vector3.MoveTowards(
                currentPos,
                targetPos,
                travelSpeed * Time.deltaTime);

            float distance = Vector3.Distance(playerMarker.position, targetPos);
            if (distance < 0.1f)
            {
                ArriveAtNode(targetNode);
            }
        }

        protected virtual void ArriveAtNode(MapNode node)
        {
            SetCurrentNode(node);
            isTraveling = false;
            targetNode = null;

            OnTravelEnded?.Invoke();
            OnCurrentNodeChanged?.Invoke(currentNode);
            EventManager.WorldMap.OnTravelEnd?.Invoke();
            EventManager.WorldMap.OnNodeReached?.Invoke(currentNode);

            Debug.Log($"抵达 {node.NodeName}");

            if (node.HasEnemy && !node.IsDefeated)
            {
                Debug.Log("遭遇敌人！准备战斗");
                EventManager.UI.OnShowMessage?.Invoke($"遭遇敌人！地点: {node.NodeName}");
            }
        }

        protected virtual void SetCurrentNode(MapNode node)
        {
            currentNode = node;
            if (!visitedNodes.Contains(node))
            {
                visitedNodes.Add(node);
                node.IsVisited = true;
            }
        }

        public virtual void UpdatePlayerMarkerPosition(Vector3 position)
        {
            if (playerMarker != null)
            {
                playerMarker.position = position;
            }
        }

        public virtual List<MapNode> GetReachableNodes()
        {
            List<MapNode> reachable = new List<MapNode>();
            if (currentNode != null && currentNode.ConnectedNodes != null)
            {
                reachable.AddRange(currentNode.ConnectedNodes);
            }
            return reachable;
        }

        public virtual void DefeatCurrentNodeEnemies()
        {
            if (currentNode != null)
            {
                currentNode.IsDefeated = true;
                Debug.Log($"已清除 {currentNode.NodeName} 的敌人");
            }
        }

        public virtual bool HasReachableEnemy()
        {
            if (currentNode == null) return false;
            return currentNode.HasEnemy && !currentNode.IsDefeated;
        }

        protected virtual void OnDestroy()
        {
            if (allNodes != null)
            {
                foreach (MapNode node in allNodes)
                {
                    if (node != null)
                    {
                        node.OnNodeClicked -= HandleNodeClicked;
                    }
                }
            }
        }
    }
}
