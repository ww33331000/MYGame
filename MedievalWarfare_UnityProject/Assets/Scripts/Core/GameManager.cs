using UnityEngine;

namespace MedievalWarfare.Core
{
    public enum GameState
    {
        MainMenu,
        WorldMap,
        Battle,
        Pause,
        Victory,
        Defeat
    }

    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Game State")]
        [SerializeField] private GameState currentState = GameState.MainMenu;

        public GameState CurrentState => currentState;

        public System.Action<GameState> OnGameStateChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void ChangeState(GameState newState)
        {
            if (currentState == newState) return;

            GameState oldState = currentState;
            currentState = newState;

            OnGameStateChanged?.Invoke(newState);
            Debug.Log($"Game state changed: {oldState} -> {newState}");
        }

        public bool IsInBattle()
        {
            return currentState == GameState.Battle;
        }

        public bool IsInWorldMap()
        {
            return currentState == GameState.WorldMap;
        }
    }
}
