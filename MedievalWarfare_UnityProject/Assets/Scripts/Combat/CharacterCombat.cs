using UnityEngine;
using MedievalWarfare.Character;

namespace MedievalWarfare.Combat
{
    public class CharacterCombat : MonoBehaviour
    {
        [SerializeField] protected CharacterHealth health;
        [SerializeField] protected CharacterStats stats;

        [Header("攻击设置")]
        [SerializeField] protected Transform attackPoint;
        [SerializeField] protected float attackRadius = 1f;
        [SerializeField] protected LayerMask enemyLayer;
        [SerializeField] protected float attackCooldown = 1f;
        [SerializeField] protected float attackWindup = 0.3f;

        protected bool isAttacking = false;
        protected bool canDealDamage = false;
        protected float attackTimer = 0f;
        protected float cooldownTimer = 0f;

        public bool IsAttacking => isAttacking;
        public float AttackCooldown => attackCooldown;

        public System.Action OnAttackStart;
        public System.Action OnAttackHit;
        public System.Action OnAttackEnd;

        protected virtual void Awake()
        {
            if (health == null)
                health = GetComponent<CharacterHealth>();
            if (health != null)
                stats = health.Stats;

            if (attackPoint == null)
            {
                GameObject point = new GameObject("AttackPoint");
                point.transform.SetParent(transform);
                point.transform.localPosition = Vector3.forward * 1.5f + Vector3.up * 1f;
                attackPoint = point.transform;
            }
        }

        protected virtual void Update()
        {
            if (cooldownTimer > 0f)
            {
                cooldownTimer -= Time.deltaTime;
            }

            if (isAttacking)
            {
                attackTimer += Time.deltaTime;

                if (attackTimer >= attackWindup && !canDealDamage)
                {
                    canDealDamage = true;
                    PerformAttack();
                }

                if (attackTimer >= attackCooldown)
                {
                    EndAttack();
                }
            }
        }

        public virtual bool TryAttack()
        {
            if (isAttacking || cooldownTimer > 0f || health.IsDead)
                return false;

            StartAttack();
            return true;
        }

        protected virtual void StartAttack()
        {
            isAttacking = true;
            canDealDamage = false;
            attackTimer = 0f;
            OnAttackStart?.Invoke();
        }

        protected virtual void PerformAttack()
        {
            if (attackPoint == null) return;

            Collider[] hitColliders = Physics.OverlapSphere(
                attackPoint.position,
                attackRadius,
                enemyLayer);

            foreach (Collider collider in hitColliders)
            {
                CharacterHealth targetHealth = collider.GetComponent<CharacterHealth>();
                if (targetHealth != null && targetHealth != health)
                {
                    targetHealth.TakeDamage(stats.attackPower, gameObject);
                    OnAttackHit?.Invoke();
                    break;
                }
            }
        }

        protected virtual void EndAttack()
        {
            isAttacking = false;
            canDealDamage = false;
            cooldownTimer = attackCooldown - attackTimer;
            OnAttackEnd?.Invoke();
        }

        public virtual void Block(bool isBlocking)
        {
            if (health != null)
            {
                health.SetBlocking(isBlocking);
            }
        }

        public virtual void InterruptAttack()
        {
            if (isAttacking)
            {
                isAttacking = false;
                canDealDamage = false;
                OnAttackEnd?.Invoke();
            }
        }

        protected virtual void OnDrawGizmosSelected()
        {
            if (attackPoint != null)
            {
                Gizmos.color = Color.red;
                Gizmos.DrawWireSphere(attackPoint.position, attackRadius);
            }
        }
    }
}
