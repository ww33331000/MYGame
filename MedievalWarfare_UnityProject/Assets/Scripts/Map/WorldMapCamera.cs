using UnityEngine;
using MedievalWarfare.Core;

namespace MedievalWarfare.Map
{
    public class WorldMapCamera : MonoBehaviour
    {
        [Header("相机设置")]
        [SerializeField] private float moveSpeed = 20f;
        [SerializeField] private float zoomSpeed = 5f;
        [SerializeField] private float minZoom = 10f;
        [SerializeField] private float maxZoom = 50f;
        [SerializeField] private float smoothTime = 0.1f;

        [Header("地图边界")]
        [SerializeField] private Vector2 mapBoundsMin = new Vector2(-100, -100);
        [SerializeField] private Vector2 mapBoundsMax = new Vector2(100, 100);

        [SerializeField] private Transform target;

        private Camera cam;
        private Vector3 targetPosition;
        private float targetZoom;
        private Vector3 velocity;

        protected virtual void Awake()
        {
            cam = GetComponent<Camera>();
            targetPosition = transform.position;
            targetZoom = cam != null ? cam.orthographicSize : 20f;
        }

        protected virtual void Update()
        {
            HandleInput();
            UpdateCamera();
        }

        protected virtual void HandleInput()
        {
            float horizontal = Input.GetAxisRaw("Horizontal");
            float vertical = Input.GetAxisRaw("Vertical");

            Vector3 moveDir = new Vector3(horizontal, 0, vertical);
            moveDir = transform.TransformDirection(moveDir);
            moveDir.y = 0;
            moveDir.Normalize();

            targetPosition += moveDir * moveSpeed * Time.deltaTime;

            targetPosition.x = Mathf.Clamp(targetPosition.x, mapBoundsMin.x, mapBoundsMax.x);
            targetPosition.z = Mathf.Clamp(targetPosition.z, mapBoundsMin.y, mapBoundsMax.y);

            float scroll = Input.GetAxis("Mouse ScrollWheel");
            if (scroll != 0f && cam != null)
            {
                targetZoom -= scroll * zoomSpeed;
                targetZoom = Mathf.Clamp(targetZoom, minZoom, maxZoom);
            }
        }

        protected virtual void UpdateCamera()
        {
            if (target != null)
            {
                targetPosition = new Vector3(
                    target.position.x,
                    transform.position.y,
                    target.position.z);
            }

            transform.position = Vector3.SmoothDamp(
                transform.position,
                targetPosition,
                ref velocity,
                smoothTime);

            if (cam != null && cam.orthographic)
            {
                cam.orthographicSize = Mathf.Lerp(cam.orthographicSize, targetZoom, 5f * Time.deltaTime);
            }
        }

        public virtual void FollowTarget(Transform newTarget)
        {
            target = newTarget;
        }

        public virtual void StopFollowing()
        {
            target = null;
            targetPosition = transform.position;
        }

        public virtual void SetPosition(Vector3 position)
        {
            targetPosition = new Vector3(position.x, transform.position.y, position.z);
        }
    }
}
