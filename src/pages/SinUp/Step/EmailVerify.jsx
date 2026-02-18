// src/components/auth/VerifyEmail.jsx
import React, { useState, useEffect } from "react";
import { Button, Input, Form, Typography } from "antd";
import { SafetyOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtpApi } from "../../../services/authApi";
import useNotification from "../../../hooks/useNotification";

const { Title, Text } = Typography;

const EmailVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifySuccess, notifyError } = useNotification();
  const [timer, setTimer] = useState(106);
  const [form] = Form.useForm();

  const email = location.state?.email || "";
  const otpReference = location.state?.otp_reference || "";

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")} Seconds Remaining`;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: verifyOtpApi,
    onSuccess: (response) => {
      console.log(response);

      notifySuccess(response?.data?.message);
      navigate("/sign-up/make-it-yours", { state: { email } });
    },
    onError: (error) => {
      notifyError(error?.response?.data?.message);
    },
  });

  const handleSubmit = (values) => {
    mutate({
      email,
      otp: values.code,
      otp_reference: otpReference,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Title level={2} className="!text-slate-100 !mb-2">
          Verify Your Email
        </Title>
        <Text className="text-slate-300 block">
          A 6-digit code has been sent to {email || "your email"}. Enter it below.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-4"
      >
        <Form.Item
          label={
            <span className="text-sm font-medium text-slate-200">
              Verification Code *
            </span>
          }
          name="code"
          rules={[
            { required: true, message: "Please enter verification code" },
            { len: 6, message: "Code must be 6 digits" },
            { pattern: /^\d+$/, message: "Please enter only digits" },
          ]}
        >
          <Input
            prefix={<SafetyOutlined className="text-gray-400" />}
            placeholder="Enter 6-digit code"
            size="large"
            maxLength={6}
            className="rounded-lg text-center text-lg tracking-widest"
          />
        </Form.Item>

        <Text className="text-sm text-slate-400 block text-center">
          {formatTime(timer)}
        </Text>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isPending}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg h-11 font-medium border-none"
          >
            Verify
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EmailVerify;
