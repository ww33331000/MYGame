using UnityEngine;

namespace MedievalWarfare.Character
{
    [System.Serializable]
    public class CharacterStats
    {
        [Header("基础属性")]
        public float maxHealth = 100f;
        public float health = 100f;

        [Header("战斗属性")]
        public float attackPower = 20f;
        public float defense = 10f;
        public float attackSpeed = 1f;
        public float attackRange = 2f;

        [Header("移动属性")]
        public float moveSpeed = 5f;
        public float rotationSpeed = 10f;

        [Header("防御属性")]
        public bool isBlocking = false;
        public float blockReduction = 0.5f;

        public float GetDamageAfterDefense(float incomingDamage)
        {
            float damage = Mathf.Max(1f, incomingDamage - defense);
            if (isBlocking)
            {
                damage *= (1f - blockReduction);
            }
            return Mathf.Max(0f, damage);
        }
    }
}
