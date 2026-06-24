using UnityEngine;
using MedievalWarfare.Character;
using MedievalWarfare.Combat;
using MedievalWarfare.Animation;

namespace MedievalWarfare.Utils
{
    public static class DemoCharacterFactory
    {
        public static GameObject CreatePlayer(Vector3 position, Quaternion rotation)
        {
            GameObject player = CreateCharacter("Player", Color.blue, position, rotation);
            player.tag = "Player";

            PlayerController controller = player.AddComponent<PlayerController>();
            CharacterHealth health = player.GetComponent<CharacterHealth>();
            CharacterMotor motor = player.GetComponent<CharacterMotor>();
            CharacterCombat combat = player.GetComponent<CharacterCombat>();
            CharacterAnimation anim = player.GetComponent<CharacterAnimation>();

            health.Stats.maxHealth = 150f;
            health.Stats.health = 150f;
            health.Stats.attackPower = 25f;
            health.Stats.defense = 12f;
            health.Stats.moveSpeed = 5f;

            combat.GetType().GetField("enemyLayer",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(combat, LayerMask.GetMask("Default"));

            return player;
        }

        public static GameObject CreateEnemy(Vector3 position, Quaternion rotation)
        {
            GameObject enemy = CreateCharacter("Enemy", Color.red, position, rotation);

            EnemyAI ai = enemy.AddComponent<EnemyAI>();
            CharacterHealth health = enemy.GetComponent<CharacterHealth>();
            CharacterCombat combat = enemy.GetComponent<CharacterCombat>();

            health.Stats.maxHealth = 80f;
            health.Stats.health = 80f;
            health.Stats.attackPower = 15f;
            health.Stats.defense = 5f;
            health.Stats.moveSpeed = 4f;

            combat.GetType().GetField("enemyLayer",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(combat, LayerMask.GetMask("Default"));

            return enemy;
        }

        private static GameObject CreateCharacter(string name, Color color, Vector3 position, Quaternion rotation)
        {
            GameObject character = new GameObject(name);
            character.transform.position = position;
            character.transform.rotation = rotation;

            GameObject body = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            body.transform.SetParent(character.transform);
            body.transform.localPosition = Vector3.zero;
            body.transform.localScale = new Vector3(1f, 1f, 1f);
            Renderer bodyRenderer = body.GetComponent<Renderer>();
            if (bodyRenderer != null)
            {
                bodyRenderer.material.color = color;
            }

            GameObject head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.transform.SetParent(character.transform);
            head.transform.localPosition = new Vector3(0f, 1.8f, 0f);
            head.transform.localScale = new Vector3(0.5f, 0.5f, 0.5f);
            Renderer headRenderer = head.GetComponent<Renderer>();
            if (headRenderer != null)
            {
                headRenderer.material.color = color * 0.8f;
            }

            GameObject weapon = GameObject.CreatePrimitive(PrimitiveType.Cube);
            weapon.transform.SetParent(character.transform);
            weapon.transform.localPosition = new Vector3(0.6f, 1.2f, 0.5f);
            weapon.transform.localScale = new Vector3(0.1f, 0.1f, 1.2f);
            weapon.transform.localRotation = Quaternion.Euler(-10f, 0f, 0f);
            Renderer weaponRenderer = weapon.GetComponent<Renderer>();
            if (weaponRenderer != null)
            {
                weaponRenderer.material.color = Color.gray;
            }

            CharacterController cc = character.AddComponent<CharacterController>();
            cc.height = 2f;
            cc.radius = 0.5f;
            cc.center = new Vector3(0f, 1f, 0f);

            CharacterHealth health = character.AddComponent<CharacterHealth>();
            CharacterMotor motor = character.AddComponent<CharacterMotor>();
            CharacterCombat combat = character.AddComponent<CharacterCombat>();

            Animator animator = character.AddComponent<Animator>();
            CharacterAnimation charAnim = character.AddComponent<CharacterAnimation>();

            Collider[] colliders = character.GetComponentsInChildren<Collider>();
            foreach (Collider col in colliders)
            {
                if (col != cc)
                {
                    GameObject.Destroy(col);
                }
            }

            return character;
        }
    }
}
