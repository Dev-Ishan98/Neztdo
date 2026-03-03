import { useState, useEffect } from "react";
import { Button, Input, Form, Typography, Flex } from "antd";
import { SafetyOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtpApi, requestOtpApi } from "../../../services/authApi";
import useNotification from "../../../hooks/useNotification";

const { Title, Text } = Typography;

const EmailVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifySuccess, notifyError } = useNotification();
  const [timer, setTimer] = useState(120); //I am add(now) 2 minite after change 
  const [canResend, setCanResend] = useState(false);
  const [form] = Form.useForm();

  const email = location.state?.email;
  const initialOtpReference = location.state?.otp_reference;
  const [otpReference, setOtpReference] = useState(initialOtpReference);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")} Remaining`;
  };

  // Verify OTP Mutation
  const { mutate: verifyMutate, isPending: isVerifying } = useMutation({
    mutationFn: verifyOtpApi,
    onSuccess: (response) => {
      notifySuccess(response?.data?.message);
      navigate("/sign-up/make-it-yours", { state: { email } });
    },
    onError: (error) => {
      notifyError(error?.response?.data?.message);
    },
  });

  // Resend OTP Mutation
  const { mutate: resendMutate, isPending: isResending } = useMutation({
    mutationFn: requestOtpApi,
    onSuccess: (response) => {
      notifySuccess(response?.data?.message);
      setOtpReference(response?.data?.otp_reference);
      setTimer(120);
      setCanResend(false);
    },
    onError: (error) => {
      notifyError(error?.response?.data?.message);
    },
  });

  const handleSubmit = (values) => {
    verifyMutate({
      email,
      otp: values.code,
      otp_reference: otpReference,
    });
  };

  const handleResend = () => {
    resendMutate({ email });
  };

  return (
    <div className="space-y-8 max-w-md mx-auto py-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
          <SafetyOutlined className="text-3xl text-blue-500" />
        </div>
        <Title level={2} className="!text-slate-100 m-0!">
          Verify Your Email
        </Title>
        <Text className="text-slate-400 block text-lg">
          We've sent a 6-digit code to
        </Text>
        <Text className="text-blue-400 font-medium block text-lg">
          {email || "your email"}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-6"
      >
        <Form.Item
          name="code"
          rules={[
            { required: true, message: "Please enter verification code" },
            { len: 6, message: "Code must be 6 digits" },
          ]}
          className="flex justify-center"
        >
          <Input.OTP
            size="large"
            length={6}
            className="custom-otp-input"
            variant="filled"
          />
        </Form.Item>

        <div className="flex flex-col items-center space-y-4">
          {timer > 0 ? (
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <Text className="text-slate-300 font-mono text-sm">
                {formatTime(timer)}
              </Text>
            </div>
          ) : (
            <Button
              type="link"
              onClick={handleResend}
              loading={isResending}
              icon={<ReloadOutlined />}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center"
            >
              Resend Code
            </Button>
          )}
        </div>

        <Form.Item className="pt-4">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isVerifying}
            className="bg-blue-600 hover:bg-blue-700 h-12 text-lg font-semibold rounded-xl border-none shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            Verify Account
          </Button>
        </Form.Item>
      </Form>

      <style>{`
        .custom-otp-input .ant-otp-input {
          width: 50px !important;
          height: 60px !important;
          background: rgba(30, 41, 59, 0.5) !important;
          border: 1px solid rgba(71, 85, 105, 0.5) !important;
          color: white !important;
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          border-radius: 12px !important;
          transition: all 0.2s ease !important;
        }
        .custom-otp-input .ant-otp-input:focus {
          border-color: #3b82f6 !important;
          background: rgba(30, 41, 59, 0.8) !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
        }
        .ant-form-item-explain-error {
          text-align: center !important;
          margin-top: 8px !important;
        }
      `}</style>
    </div>
  );
};

export default EmailVerify;
