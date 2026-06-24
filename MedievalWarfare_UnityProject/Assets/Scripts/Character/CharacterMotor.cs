using UnityEngine;

namespace MedievalWarfare.Character
{
    [RequireComponent(typeof(CharacterController))]
    public class CharacterMotor : MonoBehaviour
    {
        [SerializeField] protected CharacterStats stats;
        protected CharacterController controller;

        protected Vector3 moveDirection;
        protected Vector3 currentVelocity;
        protected float gravity = -9.81f;
        protected float verticalVelocity;

        public bool isMoving;
        public float CurrentSpeed => moveDirection.magnitude * stats.moveSpeed;

        protected virtual void Awake()
        {
            controller = GetComponent<CharacterController>();
            if (stats == null)
            {
                var health = GetComponent<CharacterHealth>();
                if (health != null)
                {
                    stats = health.Stats;
                }
            }
        }

        public virtual void Move(Vector2 input, Transform cameraTransform = null)
        {
            Vector3 forward = cameraTransform != null ? cameraTransform.forward : transform.forward;
            Vector3 right = cameraTransform != null ? cameraTransform.right : transform.right;

            forward.y = 0f;
            right.y = 0f;
            forward.Normalize();
            right.Normalize();

            moveDirection = forward * input.y + right * input.x;
            isMoving = moveDirection.magnitude > 0.1f;

            if (isMoving)
            {
                moveDirection.Normalize();
                RotateTowards(moveDirection);
            }

            ApplyGravity();
            Vector3 movement = moveDirection * stats.moveSpeed * Time.deltaTime +
                             new Vector3(0, verticalVelocity, 0) * Time.deltaTime;

            controller.Move(movement);
        }

        public virtual void MoveTowards(Vector3 targetPosition)
        {
            Vector3 direction = targetPosition - transform.position;
            direction.y = 0f;
            float distance = direction.magnitude;

            if (distance > 0.1f)
            {
                direction.Normalize();
                moveDirection = direction;
                isMoving = true;

                RotateTowards(direction);

                ApplyGravity();
                Vector3 movement = direction * stats.moveSpeed * Time.deltaTime +
                                 new Vector3(0, verticalVelocity, 0) * Time.deltaTime;

                controller.Move(movement);
            }
            else
            {
                isMoving = false;
                moveDirection = Vector3.zero;
            }
        }

        public virtual void RotateTowards(Vector3 direction)
        {
            if (direction.magnitude < 0.1f) return;

            Quaternion targetRotation = Quaternion.LookRotation(direction);
            transform.rotation = Quaternion.Lerp(transform.rotation, targetRotation,
                stats.rotationSpeed * Time.deltaTime);
        }

        protected virtual void ApplyGravity()
        {
            if (controller.isGrounded && verticalVelocity < 0)
            {
                verticalVelocity = -2f;
            }
            else
            {
                verticalVelocity += gravity * Time.deltaTime;
            }
        }

        public virtual void Stop()
        {
            moveDirection = Vector3.zero;
            isMoving = false;
        }

        public float DistanceTo(Vector3 target)
        {
            Vector3 myPos = transform.position;
            myPos.y = 0;
            Vector3 targetPos = target;
            targetPos.y = 0;
            return Vector3.Distance(myPos, targetPos);
        }
    }
}
