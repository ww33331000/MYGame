using UnityEngine;
using MedievalWarfare.Character;

namespace MedievalWarfare.Animation
{
    [RequireComponent(typeof(Animator))]
    public class CharacterAnimation : MonoBehaviour
    {
        [SerializeField] protected CharacterMotor motor;
        [SerializeField] protected CharacterHealth health;
        [SerializeField] protected Combat.CharacterCombat combat;

        protected Animator animator;

        protected int speedHash;
        protected int isAttackingHash;
        protected int isBlockingHash;
        protected int isDeadHash;
        protected int hitTriggerHash;
        protected int attackTriggerHash;

        protected virtual void Awake()
        {
            animator = GetComponent<Animator>();

            if (motor == null) motor = GetComponent<CharacterMotor>();
            if (health == null) health = GetComponent<CharacterHealth>();
            if (combat == null) combat = GetComponent<Combat.CharacterCombat>();

            speedHash = Animator.StringToHash("Speed");
            isAttackingHash = Animator.StringToHash("IsAttacking");
            isBlockingHash = Animator.StringToHash("IsBlocking");
            isDeadHash = Animator.StringToHash("IsDead");
            hitTriggerHash = Animator.StringToHash("Hit");
            attackTriggerHash = Animator.StringToHash("Attack");
        }

        protected virtual void OnEnable()
        {
            if (health != null)
            {
                health.OnDeath += OnDeath;
                health.OnHealthChanged += OnHealthChanged;
            }
            if (combat != null)
            {
                combat.OnAttackStart += OnAttackStart;
                combat.OnAttackEnd += OnAttackEnd;
            }
        }

        protected virtual void OnDisable()
        {
            if (health != null)
            {
                health.OnDeath -= OnDeath;
                health.OnHealthChanged -= OnHealthChanged;
            }
            if (combat != null)
            {
                combat.OnAttackStart -= OnAttackStart;
                combat.OnAttackEnd -= OnAttackEnd;
            }
        }

        protected virtual void Update()
        {
            if (health != null && health.IsDead) return;

            UpdateMovementAnimation();
        }

        protected virtual void UpdateMovementAnimation()
        {
            if (motor != null && animator != null)
            {
                float speed = motor.isMoving ? 1f : 0f;
                float currentSpeed = animator.GetFloat(speedHash);
                animator.SetFloat(speedHash, Mathf.Lerp(currentSpeed, speed, 5f * Time.deltaTime));
            }
        }

        protected virtual void OnAttackStart()
        {
            if (animator != null)
            {
                animator.SetTrigger(attackTriggerHash);
                animator.SetBool(isAttackingHash, true);
            }
        }

        protected virtual void OnAttackEnd()
        {
            if (animator != null)
            {
                animator.SetBool(isAttackingHash, false);
            }
        }

        protected virtual void OnHealthChanged(float current, float max)
        {
            if (animator != null && current < max)
            {
                animator.SetTrigger(hitTriggerHash);
            }
        }

        protected virtual void OnDeath()
        {
            if (animator != null)
            {
                animator.SetBool(isDeadHash, true);
            }
        }

        public virtual void SetBlocking(bool isBlocking)
        {
            if (animator != null)
            {
                animator.SetBool(isBlockingHash, isBlocking);
            }
        }

        public virtual void PlayAttackAnimation()
        {
            if (animator != null)
            {
                animator.SetTrigger(attackTriggerHash);
            }
        }
    }
}
