// src/components/auth/Login.jsx

import { Button, Input, Form, Typography, Checkbox } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUserApi } from "../../services/authApi";
import useNotification from "../../hooks/useNotification";

const { Title, Text, Link, Paragraph } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifySuccess, notifyError } = useNotification();
  const [form] = Form.useForm();

  const email = location.state?.email || "";

  const { mutate, isPending } = useMutation({
    mutationFn: loginUserApi,
    onSuccess: (response) => {
      notifySuccess(response?.data?.message);

      // Store user data and token if needed
      const userData = response?.data?.output;

      console.log(userData);

      if (userData?.token) {
        localStorage.setItem("token", userData.token);
        localStorage.setItem("user", JSON.stringify(userData.user));
      }

      navigate("/main");
    },
    onError: (error) => {
      notifyError(error?.response?.data?.message);
    },
  });

  const handleSubmit = (values) => {
    mutate({
      email: email,
      password: values.password,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Title level={2} className="!text-slate-100 !mb-2">
          Welcome Back
        </Title>
        <Paragraph className="text-slate-300">
          Your smarter way to work starts here.
          <br />
          Enter your password to get started.
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
            <span className="text-sm font-medium text-slate-200">Email *</span>
          }
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            value={email}
            disabled
            size="large"
            className="rounded-lg bg-gray-50"
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-sm font-medium text-slate-200">
              Password *
            </span>
          }
          name="password"
          rules={[{ required: true, message: "Please enter your password" }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Enter password"
            size="large"
            className="rounded-lg"
          />
        </Form.Item>

        <div className="flex items-center justify-between">
          <Checkbox className="text-slate-300">Remember me</Checkbox>
          <Link href="#" className="text-blue-400 hover:text-blue-300">
            Reset your Password
          </Link>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isPending}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg h-11 font-medium border-none"
          >
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
