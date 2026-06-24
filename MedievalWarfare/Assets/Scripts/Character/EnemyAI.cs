using UnityEngine;
using MedievalWarfare.Character;
using MedievalWarfare.Combat;

namespace MedievalWarfare.AI
{
    public enum EnemyState
    {
        Idle,
        Patrol,
        Chase,
        Attack,
        Retreat,
        Dead
    }

    public class EnemyAI : MonoBehaviour
    {
        [SerializeField] protected CharacterMotor motor;
        [SerializeField] protected CharacterHealth health;
        [SerializeField] protected CharacterCombat combat;

        [Header("AI设置")]
        [SerializeField] protected EnemyState currentState = EnemyState.Idle;
        [SerializeField] protected float detectionRange = 15f;
        [SerializeField] protected float attackRange = 2.5f;
        [SerializeField] protected float chaseRange = 20f;
        [SerializeField] protected float patrolRange = 5f;
        [SerializeField] protected float patrolWaitTime = 3f;
        [SerializeField] protected LayerMask playerLayer;

        protected Transform playerTransform;
        protected Vector3 startPosition;
        protected Vector3 patrolTarget;
        protected float patrolTimer = 0f;
        protected float distanceToPlayer;

        public EnemyState CurrentState => currentState;

        protected virtual void Awake()
        {
            if (motor == null) motor = GetComponent<CharacterMotor>();
            if (health == null) health = GetComponent<CharacterHealth>();
            if (combat == null) combat = GetComponent<CharacterCombat>();

            startPosition = transform.position;
            patrolTarget = GetRandomPatrolPoint();
        }

        protected virtual void OnEnable()
        {
            if (health != null)
            {
                health.OnDeath += OnDeath;
            }
        }

        protected virtual void OnDisable()
        {
            if (health != null)
            {
                health.OnDeath -= OnDeath;
            }
        }

        protected virtual void Update()
        {
            if (health != null && health.IsDead)
            {
                ChangeState(EnemyState.Dead);
                return;
            }

            FindPlayer();
            UpdateState();
        }

        protected virtual void FindPlayer()
        {
            GameObject player = GameObject.FindGameObjectWithTag("Player");
            if (player != null)
            {
                playerTransform = player.transform;
                distanceToPlayer = motor != null ?
                    motor.DistanceTo(playerTransform.position) :
                    Vector3.Distance(transform.position, playerTransform.position);
            }
        }

        protected virtual void UpdateState()
        {
            switch (currentState)
            {
                case EnemyState.Idle:
                    UpdateIdleState();
                    break;
                case EnemyState.Patrol:
                    UpdatePatrolState();
                    break;
                case EnemyState.Chase:
                    UpdateChaseState();
                    break;
                case EnemyState.Attack:
                    UpdateAttackState();
                    break;
                case EnemyState.Retreat:
                    UpdateRetreatState();
                    break;
                case EnemyState.Dead:
                    break;
            }
        }

        protected virtual void UpdateIdleState()
        {
            if (motor != null) motor.Stop();

            if (playerTransform != null && distanceToPlayer < detectionRange)
            {
                ChangeState(EnemyState.Chase);
                return;
            }

            patrolTimer += Time.deltaTime;
            if (patrolTimer >= patrolWaitTime)
            {
                patrolTimer = 0f;
                ChangeState(EnemyState.Patrol);
            }
        }

        protected virtual void UpdatePatrolState()
        {
            if (playerTransform != null && distanceToPlayer < detectionRange)
            {
                ChangeState(EnemyState.Chase);
                return;
            }

            if (motor != null)
            {
                motor.MoveTowards(patrolTarget);

                if (!motor.isMoving)
                {
                    patrolTimer = 0f;
                    ChangeState(EnemyState.Idle);
                    patrolTarget = GetRandomPatrolPoint();
                }
            }
        }

        protected virtual void UpdateChaseState()
        {
            if (playerTransform == null)
            {
                ChangeState(EnemyState.Patrol);
                return;
            }

            if (distanceToPlayer > chaseRange)
            {
                ChangeState(EnemyState.Retreat);
                return;
            }

            if (distanceToPlayer <= attackRange)
            {
                ChangeState(EnemyState.Attack);
                return;
            }

            if (motor != null)
            {
                motor.MoveTowards(playerTransform.position);
            }
        }

        protected virtual void UpdateAttackState()
        {
            if (playerTransform == null)
            {
                ChangeState(EnemyState.Idle);
                return;
            }

            if (distanceToPlayer > attackRange * 1.2f)
            {
                ChangeState(EnemyState.Chase);
                return;
            }

            if (motor != null)
            {
                Vector3 direction = playerTransform.position - transform.position;
                direction.y = 0f;
                direction.Normalize();
                motor.RotateTowards(direction);
            }

            if (combat != null && !combat.IsAttacking)
            {
                combat.TryAttack();
            }
        }

        protected virtual void UpdateRetreatState()
        {
            if (motor != null)
            {
                motor.MoveTowards(startPosition);

                if (!motor.isMoving)
                {
                    ChangeState(EnemyState.Idle);
                }
            }
        }

        protected virtual void ChangeState(EnemyState newState)
        {
            if (currentState == newState) return;

            currentState = newState;
            Debug.Log($"{gameObject.name} 状态变更: {currentState}");
        }

        protected virtual Vector3 GetRandomPatrolPoint()
        {
            Vector2 random = Random.insideUnitCircle * patrolRange;
            return startPosition + new Vector3(random.x, 0f, random.y);
        }

        protected virtual void OnDeath()
        {
            ChangeState(EnemyState.Dead);
            if (motor != null) motor.Stop();
        }

        protected virtual void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, detectionRange);

            Gizmos.color = Color.red;
            Gizmos.DrawWireSphere(transform.position, attackRange);

            Gizmos.color = Color.blue;
            Gizmos.DrawWireSphere(transform.position, chaseRange);
        }
    }
}
