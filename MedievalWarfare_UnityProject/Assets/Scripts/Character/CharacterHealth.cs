using UnityEngine;
using MedievalWarfare.Core;

namespace MedievalWarfare.Character
{
    public class CharacterHealth : MonoBehaviour
    {
        [SerializeField] protected CharacterStats stats;
        public CharacterStats Stats => stats;

        public bool IsDead => stats.health <= 0f;

        [Header("受伤反馈")]
        [SerializeField] protected float hitFlashDuration = 0.2f;
        protected float hitFlashTimer = 0f;
        protected Renderer targetRenderer;
        protected Color originalColor;

        public System.Action OnDeath;
        public System.Action<float, float> OnHealthChanged;

        protected virtual void Awake()
        {
            stats.health = stats.maxHealth;
            FindTargetRenderer();
        }

        protected virtual void Update()
        {
            if (hitFlashTimer > 0f)
            {
                hitFlashTimer -= Time.deltaTime;
                if (hitFlashTimer <= 0f && targetRenderer != null)
                {
                    ResetMaterialColor();
                }
            }
        }

        protected virtual void FindTargetRenderer()
        {
            SkinnedMeshRenderer skinned = GetComponentInChildren<SkinnedMeshRenderer>();
            if (skinned != null)
            {
                targetRenderer = skinned;
            }
            else
            {
                targetRenderer = GetComponentInChildren<MeshRenderer>();
            }

            if (targetRenderer != null)
            {
                originalColor = targetRenderer.sharedMaterial.color;
            }
        }

        public virtual void TakeDamage(float damage, GameObject attacker)
        {
            if (IsDead) return;

            float actualDamage = stats.GetDamageAfterDefense(damage);
            stats.health -= actualDamage;

            OnHealthChanged?.Invoke(stats.health, stats.maxHealth);
            EventManager.Character.OnHealthChanged?.Invoke(gameObject, stats.health, stats.maxHealth);
            EventManager.Character.OnDamageDealt?.Invoke(attacker, gameObject);

            HitFlash();

            if (stats.health <= 0f)
            {
                stats.health = 0f;
                Die();
            }

            Debug.Log($"{gameObject.name} 受到 {actualDamage:F1} 点伤害, 剩余血量: {stats.health:F1}");
        }

        public virtual void Heal(float amount)
        {
            if (IsDead) return;

            stats.health = Mathf.Min(stats.health + amount, stats.maxHealth);
            OnHealthChanged?.Invoke(stats.health, stats.maxHealth);
            EventManager.Character.OnHealthChanged?.Invoke(gameObject, stats.health, stats.maxHealth);
        }

        protected virtual void HitFlash()
        {
            if (targetRenderer != null)
            {
                Material mat = targetRenderer.material;
                mat.color = Color.red;
                hitFlashTimer = hitFlashDuration;
            }
        }

        protected virtual void ResetMaterialColor()
        {
            if (targetRenderer != null)
            {
                Material mat = targetRenderer.material;
                mat.color = originalColor;
            }
        }

        protected virtual void Die()
        {
            Debug.Log($"{gameObject.name} 已死亡");
            OnDeath?.Invoke();
            EventManager.Character.OnCharacterDeath?.Invoke(gameObject);
        }

        public virtual void SetMaxHealth(float maxHealth)
        {
            stats.maxHealth = maxHealth;
            stats.health = maxHealth;
            OnHealthChanged?.Invoke(stats.health, stats.maxHealth);
        }

        public virtual void SetBlocking(bool isBlocking)
        {
            stats.isBlocking = isBlocking;
        }
    }
}
