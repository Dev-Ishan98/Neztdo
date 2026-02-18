import { notification } from "antd";

const useNotification = () => {
    const notifySuccess = (message, description = "") => {
        notification.success({
            message,
            description,
            placement: "topRight",
        });
    };

    const notifyError = (message, description = "") => {
        notification.error({
            message,
            description,
            placement: "topRight",
        });
    };

    const notifyInfo = (message, description = "") => {
        notification.info({
            message,
            description,
            placement: "topRight",
        });
    };

    const notifyWarning = (message, description = "") => {
        notification.warning({
            message,
            description,
            placement: "topRight",
        });
    };

    return { notifySuccess, notifyError, notifyInfo, notifyWarning };
};

export default useNotification;
