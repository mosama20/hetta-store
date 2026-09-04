import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button.js';

interface Props {
  children: ReactNode;
  fallbackTitleAr?: string;
  fallbackTitleEn?: string;
  isArabic?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      const isAr = this.props.isArabic !== false;
      const title = isAr
        ? this.props.fallbackTitleAr || 'عذراً، حدث خطأ غير متوقع أثناء العرض'
        : this.props.fallbackTitleEn || 'Something went wrong while rendering this section';

      return (
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 my-6 max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isAr
                ? 'تم حصر الخطأ بنجاح لحماية الموقع. يمكنك إعادة المحاولة أو العودة للرئيسية.'
                : 'The error was contained safely. You can try refreshing or go back home.'}
            </p>
            {this.state.error && (
              <pre className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-950 p-2.5 rounded-xl text-start overflow-x-auto max-h-24">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={this.handleReset}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              <span>{isAr ? 'إعادة المحاولة' : 'Try Again'}</span>
            </Button>
            <a href="/darsh50">
              <Button variant="outline" size="sm">
                <Home className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                <span>{isAr ? 'لوحة التحكم' : 'Dashboard'}</span>
              </Button>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
