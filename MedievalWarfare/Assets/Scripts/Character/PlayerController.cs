using UnityEngine;
using MedievalWarfare.Character;
using MedievalWarfare.Combat;

namespace MedievalWarfare.Character
{
    public class PlayerController : MonoBehaviour
    {
        [SerializeField] protected CharacterMotor motor;
        [SerializeField] protected CharacterHealth health;
        [SerializeField] protected CharacterCombat combat;
        [SerializeField] protected Animation.CharacterAnimation anim;

        [Header("相机设置")]
        [SerializeField] protected Transform cameraTransform;
        [SerializeField] protected float cameraDistance = 8f;
        [SerializeField] protected float cameraHeight = 4f;
        [SerializeField] protected float cameraSmoothTime = 0.1f;
        [SerializeField] protected float mouseSensitivity = 2f;

        protected Vector3 cameraVelocity;
        protected float cameraYaw = 0f;
        protected float cameraPitch = 15f;

        protected bool isBlocking = false;

        public CharacterHealth Health => health;

        protected virtual void Awake()
        {
            if (motor == null) motor = GetComponent<CharacterMotor>();
            if (health == null) health = GetComponent<CharacterHealth>();
            if (combat == null) combat = GetComponent<CharacterCombat>();
            if (anim == null) anim = GetComponent<Animation.CharacterAnimation>();

            if (cameraTransform == null && Camera.main != null)
            {
                cameraTransform = Camera.main.transform;
            }
        }

        protected virtual void Start()
        {
            if (cameraTransform != null)
            {
                Vector3 euler = cameraTransform.eulerAngles;
                cameraYaw = euler.y;
                cameraPitch = euler.x;
            }
        }

        protected virtual void Update()
        {
            if (health != null && health.IsDead) return;

            HandleCamera();
            HandleMovement();
            HandleCombat();
        }

        protected virtual void HandleCamera()
        {
            if (cameraTransform == null) return;

            float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
            float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

            cameraYaw += mouseX;
            cameraPitch -= mouseY;
            cameraPitch = Mathf.Clamp(cameraPitch, -20f, 60f);

            Vector3 targetPosition = transform.position + Vector3.up * cameraHeight;
            Quaternion rotation = Quaternion.Euler(cameraPitch, cameraYaw, 0f);
            Vector3 desiredPosition = targetPosition - rotation * Vector3.forward * cameraDistance;

            cameraTransform.position = Vector3.SmoothDamp(
                cameraTransform.position,
                desiredPosition,
                ref cameraVelocity,
                cameraSmoothTime);

            cameraTransform.LookAt(targetPosition);
        }

        protected virtual void HandleMovement()
        {
            if (motor == null) return;
            if (combat != null && combat.IsAttacking) return;

            float horizontal = Input.GetAxisRaw("Horizontal");
            float vertical = Input.GetAxisRaw("Vertical");

            Vector2 input = new Vector2(horizontal, vertical);
            if (input.magnitude > 1f)
                input.Normalize();

            if (cameraTransform != null)
            {
                motor.Move(input, cameraTransform);
            }
            else
            {
                motor.Move(input);
            }
        }

        protected virtual void HandleCombat()
        {
            if (combat == null) return;

            if (Input.GetMouseButtonDown(0))
            {
                if (!isBlocking)
                {
                    combat.TryAttack();
                }
            }

            if (Input.GetMouseButtonDown(1))
            {
                isBlocking = true;
                combat.Block(true);
                if (anim != null) anim.SetBlocking(true);
            }

            if (Input.GetMouseButtonUp(1))
            {
                isBlocking = false;
                combat.Block(false);
                if (anim != null) anim.SetBlocking(false);
            }
        }

        public virtual void SetCameraTransform(Transform cam)
        {
            cameraTransform = cam;
        }
    }
}
