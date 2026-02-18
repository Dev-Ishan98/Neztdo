// src/components/auth/WelcomeBack.jsx
import React, { useState } from "react";
import { Button, Input, Form, Typography } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { checkUserExistsApi, requestOtpApi } from "../../../services/authApi";
import useNotification from "../../../hooks/useNotification";

const { Title, Text, Paragraph } = Typography;

const SignUpEmail = () => {
  const navigate = useNavigate();
  const { notifySuccess, notifyError, notifyInfo } = useNotification();
  const [form] = Form.useForm();

  // Check if user exists mutation
  const { mutate: checkUserExists, isPending: isCheckingUser } = useMutation({
    mutationFn: checkUserExistsApi,
    onSuccess: (response) => {
      // User exists, navigate to sign-in
      //notifyInfo(response?.data?.message);
      const email = form.getFieldValue("email");
      navigate("/sign-in", { state: { email } });
    },
    onError: (error) => {
      // User doesn't exist, proceed with OTP request
      if (error?.response?.data?.success === false) {
        // This means user doesn't exist, which is expected for signup
        requestOtp({ email: form.getFieldValue("email") });
      } else {
        notifyError(error?.response?.data?.message);
      }
    },
  });

  // Request OTP mutation
  const { mutate: requestOtp, isPending: isRequestingOtp } = useMutation({
    mutationFn: requestOtpApi,
    onSuccess: (response) => {
      notifySuccess(response?.data?.message);
      const otpReference = response?.data?.output?.otp_reference;
      navigate("/sign-up/verify-email", {
        state: {
          email: form.getFieldValue("email"),
          otp_reference: otpReference
        }
      });
    },
    onError: (error) => {
      notifyError(error?.response?.data?.message);
    },
  });

  const handleSubmit = (values) => {
    // First check if user exists
    checkUserExists(values);
  };

  const isPending = isCheckingUser || isRequestingOtp;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Title level={2} className="!text-slate-100 !mb-2">
          Welcome Back
        </Title>
        <Paragraph className="text-slate-300">
          Your smarter way to work starts here.
          <br />
          Enter your email to get started in under a minute.
        </Paragraph>
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
              Enter Your Email *
            </span>
          }
          name="email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="Enter email"
            size="large"
            className="rounded-lg"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isPending}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg h-11 font-medium border-none"
          >
            Continue
          </Button>
        </Form.Item>
      </Form>

      <Text className="text-xs text-slate-400 block text-center">
        Your email is only used for account setup.
        <br />
        We'll never share it.
      </Text>
    </div>
  );
};

export default SignUpEmail;
