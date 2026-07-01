<?php

/*
|--------------------------------------------------------------------------
| TEMPLATE RENDERER
|--------------------------------------------------------------------------
| Loads an HTML email template and replaces {{placeholder}} tokens with
| values. Any placeholder left without a matching value is stripped so
| stray "{{...}}" text never leaks into a sent email.
*/

class TemplateRenderer
{
    public static function render(string $templatePath, array $data): string
    {
        if (!is_file($templatePath)) {
            throw new RuntimeException("Email template not found: {$templatePath}");
        }

        $template = file_get_contents($templatePath);

        foreach ($data as $key => $value) {
            $template = str_replace('{{' . $key . '}}', (string) $value, $template);
        }

        return preg_replace('/{{\s*[a-zA-Z0-9_]+\s*}}/', '', $template);
    }
}
