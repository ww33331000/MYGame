using UnityEngine;

namespace MedievalWarfare.Map
{
    public enum NodeType
    {
        Town,
        Village,
        Castle,
        EnemyCamp,
        BanditLair,
        Forest,
        Mountain,
        River,
        StartingPoint
    }

    public class MapNode : MonoBehaviour
    {
        [Header("节点信息")]
        [SerializeField] private string nodeName = "未知地点";
        [SerializeField] private NodeType nodeType = NodeType.Village;
        [TextArea] [SerializeField] private string description = "";

        [Header("战斗设置")]
        [SerializeField] private bool hasEnemy = false;
        [SerializeField] private int enemyCount = 3;
        [SerializeField] private float enemyHealthMultiplier = 1f;
        [SerializeField] private float enemyDamageMultiplier = 1f;

        [Header("连接")]
        [SerializeField] private MapNode[] connectedNodes;

        [Header("视觉")]
        [SerializeField] private Color nodeColor = Color.white;
        [SerializeField] private float nodeRadius = 1f;

        public string NodeName => nodeName;
        public NodeType NodeType => nodeType;
        public string Description => description;
        public bool HasEnemy => hasEnemy;
        public int EnemyCount => enemyCount;
        public float EnemyHealthMultiplier => enemyHealthMultiplier;
        public float EnemyDamageMultiplier => enemyDamageMultiplier;
        public MapNode[] ConnectedNodes => connectedNodes;
        public Color NodeColor => nodeColor;
        public float NodeRadius => nodeRadius;

        public bool IsVisited { get; set; }
        public bool IsDefeated { get; set; }

        public System.Action<MapNode> OnNodeClicked;

        protected virtual void OnMouseDown()
        {
            OnNodeClicked?.Invoke(this);
        }

        protected virtual void OnDrawGizmos()
        {
            Gizmos.color = nodeColor;
            Gizmos.DrawSphere(transform.position, nodeRadius);

            Gizmos.color = Color.gray;
            if (connectedNodes != null)
            {
                foreach (MapNode node in connectedNodes)
                {
                    if (node != null)
                    {
                        Gizmos.DrawLine(transform.position, node.transform.position);
                    }
                }
            }
        }

        public bool IsConnectedTo(MapNode otherNode)
        {
            if (connectedNodes == null) return false;
            foreach (MapNode node in connectedNodes)
            {
                if (node == otherNode) return true;
            }
            return false;
        }
    }
}
