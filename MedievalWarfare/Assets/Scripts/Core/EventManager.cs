using UnityEngine;

namespace MedievalWarfare.Core
{
    public static class EventManager
    {
        public static class Character
        {
            public static System.Action<GameObject, float, float> OnHealthChanged;
            public static System.Action<GameObject> OnCharacterDeath;
            public static System.Action<GameObject, GameObject> OnDamageDealt;
        }

        public static class Battle
        {
            public static System.Action OnBattleStart;
            public static System.Action<bool> OnBattleEnd;
            public static System.Action<int> OnEnemyCountChanged;
        }

        public static class WorldMap
        {
            public static System.Action<MapNode> OnNodeReached;
            public static System.Action<MapNode> OnNodeSelected;
            public static System.Action OnTravelStart;
            public static System.Action OnTravelEnd;
        }

        public static class UI
        {
            public static System.Action<string> OnShowMessage;
            public static System.Action<bool> OnPauseToggle;
        }
    }
}
