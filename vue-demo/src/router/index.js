import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import RememberPasswordView from '@/views/RememberPasswordView.vue'
import LogoutView from '@/views/LogoutView.vue'
import ProfileView from '@/views/ProfileView.vue'
import ProblemsListView from '@/views/ProblemsListView.vue'
import ProblemView from '@/views/ProblemView.vue'
import CreateProblemView from '@/views/CreateProblemView.vue'
import RegistrationView from '@/views/RegistrationView.vue';
import VerifyEmailView from '@/views/VerifyEmailView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/registration',
      name: 'registration',
      component: RegistrationView,
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: VerifyEmailView,
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
    },
    {
      path: '/remember-password',
      name: 'remember-password',
      component: RememberPasswordView,
    },
    {
      path: '/logout',
      name: 'logout',
      component: LogoutView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/report',
      name: 'report',
      component: CreateProblemView,
    },
    {
      path: '/problems',
      redirect: '/problems/all',
      children: [
        {
          path: 'all',
          name: 'problems-list',
          component: ProblemsListView,
        },
        {
          path: ':id',
          name: 'problem',
          component: ProblemView,
        },
      ]
    }
  ],
})

export default router
